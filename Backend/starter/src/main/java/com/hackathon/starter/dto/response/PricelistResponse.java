package com.hackathon.starter.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PricelistResponse(
        Long id,
        String name,
        boolean isDefault,
        LocalDate validFrom,
        LocalDate validTo,
        boolean active,
        LocalDateTime createdAt
) {
}
