package com.hackathon.starter.mapper;

import com.hackathon.starter.dto.response.CartItemResponse;
import com.hackathon.starter.dto.response.CartResponse;
import com.hackathon.starter.entity.Cart;
import com.hackathon.starter.entity.CartItem;
import com.hackathon.starter.service.PricingService;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Cart prices are computed live (not snapshotted) - snapshotting only happens at order confirmation (DB_SCHEMA.md §4). */
@Component
public class CartMapper {

    private final PricingService pricingService;

    public CartMapper(PricingService pricingService) {
        this.pricingService = pricingService;
    }

    public CartItemResponse toResponse(CartItem item) {
        var pricing = pricingService.resolveLinePricing(
                item.getProductVariant().getId(), item.getStartDate(), item.getEndDate(),
                item.getRentalPeriod(), item.getQuantity());
        return new CartItemResponse(
                item.getId(), item.getProductVariant().getId(), item.getProductVariant().getProduct().getName(),
                item.getQuantity(), item.getStartDate(), item.getEndDate(),
                item.getRentalPeriod() != null ? item.getRentalPeriod().getId() : null,
                pricing.unitPrice(), pricing.lineTotal());
    }

    public CartResponse toResponse(Cart cart) {
        var items = cart.getItems().stream().map(this::toResponse).toList();
        BigDecimal subtotal = items.stream().map(CartItemResponse::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal deposit = cart.getItems().stream()
                .map(item -> item.getProductVariant().getProduct().getSecurityDepositAmount()
                        .multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CartResponse(cart.getId(), items, subtotal, deposit, subtotal.add(deposit));
    }
}
