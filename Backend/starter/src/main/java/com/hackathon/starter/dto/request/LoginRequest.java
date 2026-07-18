package com.hackathon.starter.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @Schema(example = "jane@example.com")
        @NotBlank @Email
        String email,

        @Schema(example = "correct-horse-battery")
        @NotBlank
        String password
) {
}
