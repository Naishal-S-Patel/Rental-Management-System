package com.hackathon.storage_service.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record GenerateUploadUrlRequest(
        @Schema(description = "Caller-supplied user id - not validated against any auth system, this service has none",
                example = "a1b2c3d4-0000-0000-0000-000000000000")
        @NotBlank String userId,

        @Schema(example = "resume.pdf")
        @NotBlank String fileName,

        @Schema(example = "application/pdf")
        String contentType
) {
}
