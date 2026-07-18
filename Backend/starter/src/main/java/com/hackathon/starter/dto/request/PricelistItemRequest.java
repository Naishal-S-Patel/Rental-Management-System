package com.hackathon.starter.dto.request;

import com.hackathon.starter.enums.DurationUnit;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record PricelistItemRequest(
        @NotNull
        UUID productVariantId,

        @NotNull
        DurationUnit durationUnit,

        @Schema(description = "Price per one unit of durationUnit (e.g. per day)", example = "500.00")
        @NotNull @Positive
        BigDecimal unitPrice
) {
}
