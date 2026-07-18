package com.hackathon.starter.dto.response;

import java.math.BigDecimal;

public record PaymentInitiateResponse(
        String razorpayOrderId,
        String razorpayKeyId,
        BigDecimal amount,
        String currency
) {
}
