package com.hackathon.starter.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
        @Schema(example = "Canon EOS R5")
        @NotBlank @Size(max = 150)
        String name,

        @Schema(example = "Full-frame mirrorless camera, 45MP")
        String description,

        @Schema(example = "Cameras")
        @Size(max = 100)
        String category,

        @Schema(description = "Base rental price, also the late-fee calculation base (PRD_README.md §7)", example = "1500.00")
        @NotNull @PositiveOrZero
        BigDecimal basePrice,

        @Schema(description = "Fixed security deposit for this product (PRD_README.md §6/Q7 - not global, not percentage-based)", example = "5000.00")
        @NotNull @PositiveOrZero
        BigDecimal securityDepositAmount
) {
}
