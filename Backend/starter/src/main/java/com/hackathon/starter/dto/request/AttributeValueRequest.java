package com.hackathon.starter.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AttributeValueRequest(
        @Schema(example = "Canon")
        @NotBlank @Size(max = 100)
        String value
) {
}
