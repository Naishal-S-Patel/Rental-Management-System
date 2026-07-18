package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.PickupConfirmRequest;
import com.hackathon.starter.dto.request.PickupScheduleRequest;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.PickupResponse;
import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.entity.User;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.mapper.PickupReturnMapper;
import com.hackathon.starter.repository.UserRepository;
import com.hackathon.starter.security.UserPrincipal;
import com.hackathon.starter.service.OrderService;
import com.hackathon.starter.service.PickupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** ADMIN-only (SecurityConfig). */
@RestController
@Tag(name = "Pickups", description = "Admin-only pickup scheduling and confirmation")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class PickupController {

    private final PickupService pickupService;
    private final OrderService orderService;
    private final PickupReturnMapper mapper;
    private final UserRepository userRepository;

    public PickupController(PickupService pickupService, OrderService orderService, PickupReturnMapper mapper, UserRepository userRepository) {
        this.pickupService = pickupService;
        this.orderService = orderService;
        this.mapper = mapper;
        this.userRepository = userRepository;
    }

    @GetMapping("/api/pickups")
    @Operation(summary = "Daily pickup schedule", description = "Defaults to today if no date is supplied.")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Pickups",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = PickupResponse.class)))))
    public ResponseEntity<List<PickupResponse>> listByDate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(pickupService.listByDate(date != null ? date : LocalDate.now()).stream().map(mapper::toResponse).toList());
    }

    @PostMapping("/api/orders/{id}/pickup/schedule")
    @Operation(summary = "Schedule a pickup", description = "PAID -> SCHEDULED_PICKUP.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Scheduled",
                    content = @Content(schema = @Schema(implementation = PickupResponse.class))),
            @ApiResponse(responseCode = "404", description = "Order not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Order is not PAID",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<PickupResponse> schedule(@PathVariable UUID id, @Valid @RequestBody PickupScheduleRequest request) {
        RentalOrder order = orderService.getById(id);
        return ResponseEntity.ok(mapper.toResponse(pickupService.schedule(order, request.scheduledDate())));
    }

    @PostMapping("/api/orders/{id}/pickup/confirm")
    @Operation(summary = "Confirm pickup", description = "SCHEDULED_PICKUP -> ACTIVE. Also creates the order's return record.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Confirmed",
                    content = @Content(schema = @Schema(implementation = PickupResponse.class))),
            @ApiResponse(responseCode = "404", description = "Order not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Order is not SCHEDULED_PICKUP",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<PickupResponse> confirm(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id,
                                                    @RequestBody(required = false) PickupConfirmRequest request) {
        User admin = userRepository.findById(principal.getId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        RentalOrder order = orderService.getById(id);
        String notes = request != null ? request.checklistNotes() : null;
        return ResponseEntity.ok(mapper.toResponse(pickupService.confirm(order, admin, notes)));
    }
}
