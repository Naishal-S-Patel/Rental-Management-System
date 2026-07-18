package com.hackathon.starter.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record OAuth2ExchangeRequest(
        @Schema(description = "One-time opaque code from the OAuth2 redirect query string (60s TTL)")
        @NotBlank
        String code
) {
}
