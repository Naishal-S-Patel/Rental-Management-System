package com.hackathon.starter.dto.response;

import com.hackathon.starter.enums.DurationUnit;

public record RentalPeriodResponse(
        Long id,
        String name,
        int durationValue,
        DurationUnit durationUnit,
        boolean active
) {
}
