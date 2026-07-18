package com.hackathon.starter.dto.response;

import java.util.Map;
import java.util.UUID;

public record ProductVariantResponse(
        UUID id,
        String sku,
        int totalQuantity,
        boolean active,
        Map<String, String> attributes
) {
}
