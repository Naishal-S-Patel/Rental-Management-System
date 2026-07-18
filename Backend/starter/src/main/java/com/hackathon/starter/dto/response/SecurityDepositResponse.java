package com.hackathon.starter.dto.response;

import com.hackathon.starter.enums.DepositStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record SecurityDepositResponse(
        Long id,
        UUID orderId,
        BigDecimal amount,
        DepositStatus status,
        LocalDateTime createdAt
) {
}
