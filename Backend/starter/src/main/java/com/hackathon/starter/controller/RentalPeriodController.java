package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.RentalPeriodRequest;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.RentalPeriodResponse;
import com.hackathon.starter.mapper.PricingMapper;
import com.hackathon.starter.service.RentalPeriodService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** GET is any authenticated user (customers pick a period template in cart, PRD_README.md §4/Q5); writes require ADMIN (SecurityConfig). */
@RestController
@RequestMapping("/api/rental-periods")
@Tag(name = "Rental Periods", description = "Named duration templates (e.g. 'Weekend', '1 Week')")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class RentalPeriodController {

    private final RentalPeriodService rentalPeriodService;
    private final PricingMapper pricingMapper;

    public RentalPeriodController(RentalPeriodService rentalPeriodService, PricingMapper pricingMapper) {
        this.rentalPeriodService = rentalPeriodService;
        this.pricingMapper = pricingMapper;
    }

    @GetMapping
    @Operation(summary = "List active rental period templates")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Rental periods",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = RentalPeriodResponse.class)))))
    public ResponseEntity<List<RentalPeriodResponse>> list() {
        return ResponseEntity.ok(rentalPeriodService.listActive().stream().map(pricingMapper::toResponse).toList());
    }

    @PostMapping
    @Operation(summary = "Create a rental period template")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Created",
                    content = @Content(schema = @Schema(implementation = RentalPeriodResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<RentalPeriodResponse> create(@Valid @RequestBody RentalPeriodRequest request) {
        var period = rentalPeriodService.create(request.name(), request.durationValue(), request.durationUnit());
        return ResponseEntity.status(HttpStatus.CREATED).body(pricingMapper.toResponse(period));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a rental period template")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated",
                    content = @Content(schema = @Schema(implementation = RentalPeriodResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<RentalPeriodResponse> update(@PathVariable Long id, @Valid @RequestBody RentalPeriodRequest request) {
        var period = rentalPeriodService.update(id, request.name(), request.durationValue(), request.durationUnit());
        return ResponseEntity.ok(pricingMapper.toResponse(period));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate a rental period template")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Deactivated"),
            @ApiResponse(responseCode = "403", description = "Not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        rentalPeriodService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
