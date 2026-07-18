package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.RentalSettingsRequest;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.RentalSettingsResponse;
import com.hackathon.starter.entity.RentalSettings;
import com.hackathon.starter.service.RentalSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** ADMIN-only (SecurityConfig: grouped under /api/admin/**) - org-wide rental config (PDF §3). */
@RestController
@RequestMapping("/api/admin/rental-settings")
@Tag(name = "Rental Settings", description = "Admin-only org-wide rental configuration")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class RentalSettingsController {

    private final RentalSettingsService rentalSettingsService;

    public RentalSettingsController(RentalSettingsService rentalSettingsService) {
        this.rentalSettingsService = rentalSettingsService;
    }

    @GetMapping
    @Operation(summary = "Get current org-wide rental settings")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Settings",
            content = @Content(schema = @Schema(implementation = RentalSettingsResponse.class))))
    public ResponseEntity<RentalSettingsResponse> get() {
        return ResponseEntity.ok(toResponse(rentalSettingsService.getSettings()));
    }

    @PutMapping
    @Operation(summary = "Update org-wide rental settings", description = "Grace period, daily late-fee %, max late-fee multiplier, default pickup/return windows.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated",
                    content = @Content(schema = @Schema(implementation = RentalSettingsResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<RentalSettingsResponse> update(@Valid @RequestBody RentalSettingsRequest request) {
        var settings = rentalSettingsService.updateSettings(request.dailyLateFeePercentage(), request.maxLateFeeMultiplier(),
                request.gracePeriodDays(), request.defaultPickupWindowDays(), request.defaultReturnWindowDays());
        return ResponseEntity.ok(toResponse(settings));
    }

    private RentalSettingsResponse toResponse(RentalSettings settings) {
        return new RentalSettingsResponse(settings.getDailyLateFeePercentage(), settings.getMaxLateFeeMultiplier(),
                settings.getGracePeriodDays(), settings.getDefaultPickupWindowDays(), settings.getDefaultReturnWindowDays(),
                settings.getUpdatedAt());
    }
}
