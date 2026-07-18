package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.response.DepositTransactionResponse;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.SecurityDepositResponse;
import com.hackathon.starter.mapper.DepositMapper;
import com.hackathon.starter.security.UserPrincipal;
import com.hackathon.starter.service.DepositService;
import com.hackathon.starter.service.OrderAccessService;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** Read-only ledger views - own order, or any order if admin (SYSTEM_DESIGN.md §9.9). */
@RestController
@RequestMapping("/api/orders/{orderId}/deposit")
@Tag(name = "Deposits", description = "Security deposit status and append-only transaction ledger")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class DepositController {

    private final DepositService depositService;
    private final DepositMapper depositMapper;
    private final OrderAccessService orderAccessService;

    public DepositController(DepositService depositService, DepositMapper depositMapper, OrderAccessService orderAccessService) {
        this.depositService = depositService;
        this.depositMapper = depositMapper;
        this.orderAccessService = orderAccessService;
    }

    @GetMapping
    @Operation(summary = "Current deposit status and amount for an order")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Deposit",
                    content = @Content(schema = @Schema(implementation = SecurityDepositResponse.class))),
            @ApiResponse(responseCode = "404", description = "Order or deposit not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<SecurityDepositResponse> get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID orderId) {
        var order = orderAccessService.requireOwnedOrAdmin(principal, orderId);
        return ResponseEntity.ok(depositMapper.toResponse(depositService.getForOrder(order.getId())));
    }

    @GetMapping("/transactions")
    @Operation(summary = "Full deposit ledger for an order", description = "Append-only HOLD/DEDUCTION/REFUND rows, newest first.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Transactions",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = DepositTransactionResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Order or deposit not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<DepositTransactionResponse>> listTransactions(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID orderId) {
        var order = orderAccessService.requireOwnedOrAdmin(principal, orderId);
        var deposit = depositService.getForOrder(order.getId());
        return ResponseEntity.ok(depositService.listTransactions(deposit.getId()).stream().map(depositMapper::toResponse).toList());
    }
}
