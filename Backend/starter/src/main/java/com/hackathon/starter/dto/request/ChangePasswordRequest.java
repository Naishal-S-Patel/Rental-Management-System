package com.hackathon.starter.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @Schema(description = "Must match the account's current password")
        @NotBlank
        String currentPassword,

        @NotBlank @Size(min = 8, max = 100)
        String newPassword
) {
}
