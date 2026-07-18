package com.hackathon.starter.dto.response;

import com.hackathon.starter.enums.InvoiceType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record InvoiceResponse(
        UUID id,
        UUID orderId,
        InvoiceType type,
        BigDecimal amount,
        LocalDateTime issuedAt
) {
}
