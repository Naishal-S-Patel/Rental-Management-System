package com.hackathon.starter.dto.response;

import com.hackathon.starter.enums.FulfillmentMethod;
import com.hackathon.starter.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        UUID customerId,
        String customerName,
        OrderStatus status,
        FulfillmentMethod fulfillmentMethod,
        UUID deliveryAddressId,
        List<OrderLineResponse> lines,
        BigDecimal subtotalAmount,
        BigDecimal depositAmount,
        BigDecimal totalAmount,
        UUID confirmedBy,
        LocalDateTime confirmedAt,
        LocalDateTime createdAt
) {
}
