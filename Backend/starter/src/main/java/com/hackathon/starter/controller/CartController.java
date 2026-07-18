package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.CartItemRequest;
import com.hackathon.starter.dto.request.CheckoutRequest;
import com.hackathon.starter.dto.response.CartResponse;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.OrderResponse;
import com.hackathon.starter.mapper.CartMapper;
import com.hackathon.starter.mapper.OrderMapper;
import com.hackathon.starter.security.UserPrincipal;
import com.hackathon.starter.service.CartService;
import com.hackathon.starter.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** CUSTOMER only (SecurityConfig) - admin uses quotations for in-store, not a cart. */
@RestController
@RequestMapping("/api/cart")
@Tag(name = "Cart", description = "Portal self-service cart")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class CartController {

    private final CartService cartService;
    private final CartMapper cartMapper;
    private final OrderService orderService;
    private final OrderMapper orderMapper;

    public CartController(CartService cartService, CartMapper cartMapper, OrderService orderService, OrderMapper orderMapper) {
        this.cartService = cartService;
        this.cartMapper = cartMapper;
        this.orderService = orderService;
        this.orderMapper = orderMapper;
    }

    @GetMapping
    @Operation(summary = "Get the current user's cart")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Cart",
            content = @Content(schema = @Schema(implementation = CartResponse.class))))
    public ResponseEntity<CartResponse> getCart(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cartMapper.toResponse(cartService.getOrCreateCart(principal.getId())));
    }

    @PostMapping("/items")
    @Operation(summary = "Add a line to the cart", description = "Availability check here is advisory - re-checked authoritatively at order confirmation.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated cart",
                    content = @Content(schema = @Schema(implementation = CartResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed or out of stock",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Product variant or rental period not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<CartResponse> addItem(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CartItemRequest request) {
        var cart = cartService.addItem(principal.getId(), request.productVariantId(), request.quantity(),
                request.startDate(), request.endDate(), request.rentalPeriodId());
        return ResponseEntity.ok(cartMapper.toResponse(cart));
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "Change a cart line's quantity/dates")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated cart",
                    content = @Content(schema = @Schema(implementation = CartResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed or out of stock",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Cart item not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<CartResponse> updateItem(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
                                                     @Valid @RequestBody CartItemRequest request) {
        var cart = cartService.updateItem(principal.getId(), id, request.quantity(), request.startDate(),
                request.endDate(), request.rentalPeriodId());
        return ResponseEntity.ok(cartMapper.toResponse(cart));
    }

    @DeleteMapping("/items/{id}")
    @Operation(summary = "Remove a cart line")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Removed"),
            @ApiResponse(responseCode = "404", description = "Cart item not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> removeItem(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        cartService.removeItem(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/checkout")
    @Operation(summary = "Checkout the cart", description = "Creates a RentalOrder in PENDING_ADMIN_CONFIRMATION and clears the cart - "
            + "every order requires explicit admin confirmation before payment (PRD_README.md §2).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order created",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class))),
            @ApiResponse(responseCode = "400", description = "Cart is empty, out of stock, or missing delivery address",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<OrderResponse> checkout(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CheckoutRequest request) {
        var order = orderService.checkoutFromCart(principal.getId(), request.fulfillmentMethod(), request.deliveryAddressId());
        return ResponseEntity.ok(orderMapper.toResponse(order));
    }
}
