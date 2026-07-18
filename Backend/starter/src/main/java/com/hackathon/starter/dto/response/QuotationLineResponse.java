package com.hackathon.starter.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record QuotationLineResponse(
        Long id,
        UUID productVariantId,
        String productName,
        int quantity,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
