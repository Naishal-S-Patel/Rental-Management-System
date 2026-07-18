package com.hackathon.starter.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
        @Schema(description = "Refresh JWT previously issued by /login, /refresh, or /oauth2/exchange")
        @NotBlank
        String refreshToken
) {
}
