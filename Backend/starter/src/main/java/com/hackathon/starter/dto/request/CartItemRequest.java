package com.hackathon.starter.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.UUID;

public record CartItemRequest(
        @NotNull
        UUID productVariantId,

        @NotNull @Positive
        Integer quantity,

        @NotNull @FutureOrPresent
        LocalDate startDate,

        @NotNull @Future
        LocalDate endDate,

        @Schema(description = "Optional RentalPeriod template id - if set, its duration drives pricing/dates instead of free-form (PRD_README.md §4/Q5)")
        Long rentalPeriodId
) {
}
