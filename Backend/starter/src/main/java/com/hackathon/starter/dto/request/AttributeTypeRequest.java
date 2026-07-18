package com.hackathon.starter.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AttributeTypeRequest(
        @Schema(example = "Brand")
        @NotBlank @Size(max = 50)
        String name
) {
}
