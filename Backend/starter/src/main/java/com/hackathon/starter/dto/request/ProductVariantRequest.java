package com.hackathon.starter.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ProductVariantRequest(
        @Schema(example = "CANON-R5-BLK")
        String sku,

        @Schema(description = "Stock count for this exact attribute combination (PRD_README.md §3/Q4)", example = "3")
        @NotNull @Min(0)
        Integer totalQuantity,

        @Schema(description = "AttributeValue ids that define this variant (e.g. Color=Black). Empty for a product with no variant axes - the single implicit default variant.")
        List<Long> attributeValueIds
) {
}
