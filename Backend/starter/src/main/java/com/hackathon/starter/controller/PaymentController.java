package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.PaymentInitiateResponse;
import com.hackathon.starter.dto.response.PaymentResponse;
import com.hackathon.starter.mapper.PaymentMapper;
import com.hackathon.starter.security.UserPrincipal;
import com.hackathon.starter.service.OrderAccessService;
import com.hackathon.starter.service.PaymentService;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@Tag(name = "Payments", description = "Razorpay order creation and webhook confirmation")
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentMapper paymentMapper;
    private final OrderAccessService orderAccessService;

    public PaymentController(PaymentService paymentService, PaymentMapper paymentMapper, OrderAccessService orderAccessService) {
        this.paymentService = paymentService;
        this.paymentMapper = paymentMapper;
        this.orderAccessService = orderAccessService;
    }

    @PostMapping("/orders/{id}/payment")
    @SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
    @RateLimiter(name = "paymentLimiter")
    @Operation(summary = "Initiate payment for a confirmed order",
            description = "Creates a Razorpay order for rental + deposit combined. The order only moves to PAID once the webhook verifies the payment (SYSTEM_DESIGN.md §6.3).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Razorpay order created",
                    content = @Content(schema = @Schema(implementation = PaymentInitiateResponse.class))),
            @ApiResponse(responseCode = "404", description = "Order not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Order is not CONFIRMED",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Too many requests",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<PaymentInitiateResponse> initiate(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(paymentService.initiatePayment(id, principal.getId()));
    }

    @PostMapping("/payments/webhook")
    @Operation(summary = "Razorpay webhook", description = "Public - no JWT. Authenticity comes from the X-Razorpay-Signature HMAC header, verified against the raw body.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Processed"),
            @ApiResponse(responseCode = "400", description = "Invalid signature",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> webhook(@RequestBody String payload, @RequestHeader("X-Razorpay-Signature") String signature) {
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/orders/{id}/payments")
    @SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
    @Operation(summary = "Payment history for an order")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Payments",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = PaymentResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Order not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<PaymentResponse>> listForOrder(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        var order = orderAccessService.requireOwnedOrAdmin(principal, id);
        return ResponseEntity.ok(paymentService.listForOrder(order.getId()).stream().map(paymentMapper::toResponse).toList());
    }
}
