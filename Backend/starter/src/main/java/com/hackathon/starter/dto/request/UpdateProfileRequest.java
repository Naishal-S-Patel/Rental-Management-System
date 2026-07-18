package com.hackathon.starter.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Schema(example = "Jane")
        @NotBlank @Size(max = 50)
        String firstName,

        @Schema(example = "Doe")
        @NotBlank @Size(max = 50)
        String lastName
) {
}
