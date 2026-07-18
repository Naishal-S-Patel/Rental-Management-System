package com.hackathon.starter.dto.response;

import com.hackathon.starter.enums.QuotationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record QuotationResponse(
        UUID id,
        UUID customerId,
        String customerName,
        Long quotationTemplateId,
        QuotationStatus status,
        LocalDate validUntil,
        List<QuotationLineResponse> lines,
        BigDecimal subtotalAmount,
        UUID orderId,
        LocalDateTime createdAt
) {
}
