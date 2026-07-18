package com.hackathon.starter.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record AddressResponse(
        UUID id,
        String label,
        String line1,
        String line2,
        String city,
        String state,
        String postalCode,
        String country,
        boolean isDefault,
        LocalDateTime createdAt
) {
}
