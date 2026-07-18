package com.hackathon.starter.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record QuotationTemplateRequest(
        @NotBlank @Size(max = 100)
        String name,

        String header,

        String footer,

        String terms
) {
}
