package com.hackathon.starter.dto.request;

import com.hackathon.starter.enums.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @Schema(description = "Email address, normalized to lowercase server-side", example = "jane@example.com")
        @NotBlank @Email
        String email,

        @Schema(description = "Plaintext password (hashed with BCrypt server-side)", example = "correct-horse-battery")
        @NotBlank @Size(min = 8, max = 100)
        String password,

        @Schema(example = "Jane")
        @NotBlank @Size(max = 50)
        String firstName,

        @Schema(example = "Doe")
        @NotBlank @Size(max = 50)
        String lastName,

        @Schema(description = "Which user type this account is registering as. ADMIN cannot be self-assigned "
                + "at signup - use ROLE1..ROLE4 (rename to your domain's actual roles).", example = "ROLE1")
        @NotNull
        Role role
) {
}
