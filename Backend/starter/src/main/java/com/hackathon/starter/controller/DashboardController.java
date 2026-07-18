package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.response.DashboardSummaryResponse;
import com.hackathon.starter.dto.response.OverdueOrderResponse;
import com.hackathon.starter.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** ADMIN-only (SecurityConfig) - PDF §1 Rental Operations Dashboard. */
@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "Admin-only real-time rental operations overview")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Aggregate dashboard payload",
            description = "Active rentals, due today, upcoming pickups/returns, overdue count, revenue, deposits held, late-fee collection.")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Summary",
            content = @Content(schema = @Schema(implementation = DashboardSummaryResponse.class))))
    public ResponseEntity<DashboardSummaryResponse> summary() {
        return ResponseEntity.ok(dashboardService.summary());
    }

    @GetMapping("/overdue")
    @Operation(summary = "Detail list backing the overdue widget")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Overdue orders",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = OverdueOrderResponse.class)))))
    public ResponseEntity<List<OverdueOrderResponse>> overdue() {
        return ResponseEntity.ok(dashboardService.overdueDetail());
    }
}
