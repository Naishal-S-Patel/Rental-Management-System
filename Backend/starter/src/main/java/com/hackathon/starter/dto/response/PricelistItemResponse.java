package com.hackathon.starter.dto.response;

import com.hackathon.starter.enums.DurationUnit;

import java.math.BigDecimal;
import java.util.UUID;

public record PricelistItemResponse(
        Long id,
        UUID productVariantId,
        DurationUnit durationUnit,
        BigDecimal unitPrice
) {
}
