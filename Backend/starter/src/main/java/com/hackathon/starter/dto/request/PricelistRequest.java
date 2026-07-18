package com.hackathon.starter.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PricelistRequest(
        @Schema(example = "Summer Promo")
        @NotBlank @Size(max = 100)
        String name,

        @Schema(description = "Null = unbounded start")
        LocalDate validFrom,

        @Schema(description = "Null = unbounded end")
        LocalDate validTo,

        @Schema(description = "At most one pricelist may be default at a time - setting this unsets the previous default")
        @NotNull
        Boolean isDefault
) {
}
