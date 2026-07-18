package com.hackathon.starter.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RentalSettingsResponse(
        BigDecimal dailyLateFeePercentage,
        BigDecimal maxLateFeeMultiplier,
        int gracePeriodDays,
        int defaultPickupWindowDays,
        int defaultReturnWindowDays,
        LocalDateTime updatedAt
) {
}
