package com.hackathon.starter.dto.request;

import com.hackathon.starter.enums.DurationUnit;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record RentalPeriodRequest(
        @Schema(example = "Weekend")
        @NotBlank @Size(max = 50)
        String name,

        @Schema(example = "2")
        @NotNull @Positive
        Integer durationValue,

        @NotNull
        DurationUnit durationUnit
) {
}
