package com.hackathon.starter.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String name,
        String description,
        String category,
        BigDecimal basePrice,
        BigDecimal securityDepositAmount,
        boolean active,
        List<UUID> imageFileIds,
        List<ProductVariantResponse> variants,
        LocalDateTime createdAt
) {
}
