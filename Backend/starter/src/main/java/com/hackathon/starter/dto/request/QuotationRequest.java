package com.hackathon.starter.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record QuotationRequest(
        @NotNull
        UUID customerId,

        Long quotationTemplateId,

        LocalDate validUntil,

        @NotEmpty
        List<@Valid QuotationLineRequest> lines
) {
}
