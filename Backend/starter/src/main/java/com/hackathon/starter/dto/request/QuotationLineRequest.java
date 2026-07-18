package com.hackathon.starter.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.UUID;

public record QuotationLineRequest(
        @NotNull
        UUID productVariantId,

        @NotNull @Positive
        Integer quantity,

        @NotNull @FutureOrPresent
        LocalDate startDate,

        @NotNull @Future
        LocalDate endDate
) {
}
