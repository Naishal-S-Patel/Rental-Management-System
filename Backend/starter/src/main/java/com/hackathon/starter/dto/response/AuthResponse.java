package com.hackathon.starter.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@Builder
public record AuthResponse(
        @Schema(description = "Short-lived JWT (45 min) - send as 'Authorization: Bearer <token>'")
        String accessToken,

        @Schema(description = "Longer-lived JWT (30 days) - send only to POST /api/auth/refresh")
        String refreshToken,

        @Schema(example = "Bearer")
        String tokenType
) {
    public static AuthResponse of(String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .build();
    }
}
