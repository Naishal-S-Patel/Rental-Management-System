package com.hackathon.starter.dto.response;

import com.hackathon.starter.enums.PaymentStatus;
import com.hackathon.starter.enums.PaymentType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentResponse(
        Long id,
        UUID orderId,
        String razorpayOrderId,
        String razorpayPaymentId,
        PaymentType type,
        BigDecimal amount,
        PaymentStatus status,
        LocalDateTime createdAt
) {
}
