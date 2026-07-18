package com.hackathon.starter.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @Schema(description = "Raw token from the password-reset email link")
        @NotBlank String token,

        @Schema(example = "new-correct-horse-battery")
        @NotBlank @Size(min = 8, max = 100)
        String newPassword
) {
}
