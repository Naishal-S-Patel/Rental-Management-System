package com.hackathon.starter.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CartResponse(
        UUID id,
        List<CartItemResponse> items,
        BigDecimal subtotalAmount,
        BigDecimal depositAmount,
        BigDecimal totalAmount
) {
}
