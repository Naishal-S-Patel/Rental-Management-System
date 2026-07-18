package com.hackathon.starter.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record RentalSettingsRequest(
        @Schema(description = "Daily compounding late-fee rate, e.g. 0.0200 = 2%/day (PRD_README.md §7)", example = "0.0200")
        @NotNull @DecimalMin(value = "0.0", inclusive = true)
        BigDecimal dailyLateFeePercentage,

        @Schema(description = "Late fee can never exceed this multiple of the product's base price - its own cap, decoupled from the deposit", example = "2.00")
        @NotNull @DecimalMin(value = "0.0", inclusive = false)
        BigDecimal maxLateFeeMultiplier,

        @NotNull @Min(0)
        Integer gracePeriodDays,

        @NotNull @Min(0)
        Integer defaultPickupWindowDays,

        @NotNull @Min(0)
        Integer defaultReturnWindowDays
) {
}
