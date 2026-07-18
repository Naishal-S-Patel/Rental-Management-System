package com.hackathon.starter.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddressRequest(
        @Schema(example = "Home")
        @Size(max = 50)
        String label,

        @NotBlank @Size(max = 255)
        String line1,

        @Size(max = 255)
        String line2,

        @NotBlank @Size(max = 100)
        String city,

        @NotBlank @Size(max = 100)
        String state,

        @NotBlank @Size(max = 20)
        String postalCode,

        @NotBlank @Size(max = 100)
        String country
) {
}
