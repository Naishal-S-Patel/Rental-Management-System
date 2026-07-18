package com.hackathon.starter.dto.response;

import com.hackathon.starter.enums.DepositTxnType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DepositTransactionResponse(
        Long id,
        DepositTxnType type,
        BigDecimal amount,
        String reason,
        String razorpayRefundId,
        LocalDateTime createdAt
) {
}
