package com.hackathon.starter.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CartItemResponse(
        Long id,
        UUID productVariantId,
        String productName,
        int quantity,
        LocalDate startDate,
        LocalDate endDate,
        Long rentalPeriodId,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
