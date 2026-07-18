package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.ReturnConfirmRequest;
import com.hackathon.starter.dto.response.DamageReportResponse;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.OrderResponse;
import com.hackathon.starter.dto.response.ReturnResponse;
import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.entity.User;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.mapper.OrderMapper;
import com.hackathon.starter.mapper.PickupReturnMapper;
import com.hackathon.starter.repository.UserRepository;
import com.hackathon.starter.security.UserPrincipal;
import com.hackathon.starter.service.OrderService;
import com.hackathon.starter.service.RentalReturnService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** ADMIN-only (SecurityConfig). */
@RestController
@Tag(name = "Returns", description = "Admin-only return confirmation, damage reporting, and deposit settlement")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class ReturnController {

    private final RentalReturnService rentalReturnService;
    private final OrderService orderService;
    private final PickupReturnMapper mapper;
    private final OrderMapper orderMapper;
    private final UserRepository userRepository;

    public ReturnController(RentalReturnService rentalReturnService, OrderService orderService, PickupReturnMapper mapper,
                             OrderMapper orderMapper, UserRepository userRepository) {
        this.rentalReturnService = rentalReturnService;
        this.orderService = orderService;
        this.mapper = mapper;
        this.orderMapper = orderMapper;
        this.userRepository = userRepository;
    }

    @GetMapping("/api/returns")
    @Operation(summary = "Daily return schedule", description = "Defaults to today if no date is supplied.")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Returns",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ReturnResponse.class)))))
    public ResponseEntity<List<ReturnResponse>> listByDate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(rentalReturnService.listByDate(date != null ? date : LocalDate.now()).stream().map(mapper::toResponse).toList());
    }

    @PostMapping("/api/orders/{id}/return/confirm")
    @Operation(summary = "Confirm a return", description = "ACTIVE -> RETURNED. Records condition, damage, and missing-accessory flags.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Confirmed",
                    content = @Content(schema = @Schema(implementation = ReturnResponse.class))),
            @ApiResponse(responseCode = "404", description = "Order not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Order is not ACTIVE",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ReturnResponse> confirmReturn(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id,
                                                          @Valid @RequestBody ReturnConfirmRequest request) {
        User admin = userRepository.findById(principal.getId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        RentalOrder order = orderService.getById(id);
        var rentalReturn = rentalReturnService.confirmReturn(order, admin, request.conditionNotes(),
                request.damageReported(), request.missingAccessories());
        return ResponseEntity.ok(mapper.toResponse(rentalReturn));
    }

    @PostMapping("/api/orders/{id}/return/settle")
    @Operation(summary = "Settle the deposit and close the order",
            description = "RETURNED -> SETTLED -> CLOSED. Single-transaction: late-fee calculation, deposit deduction, Razorpay refund, invoice generation (SYSTEM_DESIGN.md §4).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Settled and closed",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class))),
            @ApiResponse(responseCode = "404", description = "Order not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Order is not RETURNED",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<OrderResponse> settle(@PathVariable UUID id) {
        RentalOrder order = orderService.getById(id);
        return ResponseEntity.ok(orderMapper.toResponse(rentalReturnService.settle(order)));
    }

    @PostMapping("/api/orders/{id}/damage-report")
    @Operation(summary = "Attach a damage report", description = "multipart/form-data - description, estimatedCost, and optional photo files.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Created",
                    content = @Content(schema = @Schema(implementation = DamageReportResponse.class))),
            @ApiResponse(responseCode = "404", description = "Order or return not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<DamageReportResponse> addDamageReport(@PathVariable UUID id,
                                                                  @RequestParam String description,
                                                                  @RequestParam BigDecimal estimatedCost,
                                                                  @RequestParam(required = false) List<MultipartFile> photos) {
        RentalOrder order = orderService.getById(id);
        var damageReport = rentalReturnService.addDamageReport(order, description, estimatedCost, photos);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(damageReport));
    }
}
