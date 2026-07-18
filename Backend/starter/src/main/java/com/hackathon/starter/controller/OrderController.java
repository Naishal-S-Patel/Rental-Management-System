package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.CheckoutRequest;
import com.hackathon.starter.dto.request.OrderRejectRequest;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.OrderResponse;
import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.entity.User;
import com.hackathon.starter.enums.OrderStatus;
import com.hackathon.starter.enums.Role;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.mapper.OrderMapper;
import com.hackathon.starter.repository.UserRepository;
import com.hackathon.starter.security.UserPrincipal;
import com.hackathon.starter.service.OrderAccessService;
import com.hackathon.starter.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "Orders", description = "The core rental order lifecycle")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class OrderController {

    private final OrderService orderService;
    private final OrderAccessService orderAccessService;
    private final OrderMapper orderMapper;
    private final UserRepository userRepository;

    public OrderController(OrderService orderService, OrderAccessService orderAccessService,
                            OrderMapper orderMapper, UserRepository userRepository) {
        this.orderService = orderService;
        this.orderAccessService = orderAccessService;
        this.orderMapper = orderMapper;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "List orders", description = "Customers see only their own orders; admins see all, optionally filtered by status.")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Orders",
            content = @Content(schema = @Schema(implementation = OrderResponse.class))))
    public ResponseEntity<Page<OrderResponse>> list(@AuthenticationPrincipal UserPrincipal principal,
                                                      @RequestParam(required = false) OrderStatus status,
                                                      Pageable pageable) {
        Page<RentalOrder> orders;
        if (principal.getRole() == Role.ADMIN) {
            orders = status != null ? orderService.listByStatus(status, pageable) : orderService.listAll(pageable);
        } else {
            orders = orderService.listForCustomer(principal.getId(), pageable);
        }
        return ResponseEntity.ok(orders.map(orderMapper::toResponse));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get an order's detail")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class))),
            @ApiResponse(responseCode = "404", description = "Order not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<OrderResponse> getById(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        RentalOrder order = orderAccessService.requireOwnedOrAdmin(principal, id);
        return ResponseEntity.ok(orderMapper.toResponse(order));
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Admin confirms a pending order", description = "Authoritative availability re-check; generates the rental invoice.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Confirmed",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class))),
            @ApiResponse(responseCode = "400", description = "Out of stock",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Order not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Order is not pending confirmation",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<OrderResponse> confirm(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        User admin = userRepository.findById(principal.getId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(orderMapper.toResponse(orderService.confirm(id, admin)));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Admin rejects a pending order")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rejected",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class))),
            @ApiResponse(responseCode = "404", description = "Order not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Order is not pending confirmation",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<OrderResponse> reject(@PathVariable UUID id, @RequestBody(required = false) OrderRejectRequest request) {
        return ResponseEntity.ok(orderMapper.toResponse(orderService.reject(id)));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel an order", description = "Only the owning customer may cancel, and only while it hasn't been confirmed yet.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cancelled",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class))),
            @ApiResponse(responseCode = "404", description = "Order not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Order can no longer be cancelled",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<OrderResponse> cancel(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(orderMapper.toResponse(orderService.cancelOwn(id, principal.getId())));
    }
}
