package com.hackathon.starter.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        LocalDateTime timestamp,

        @Schema(example = "400")
        int status,

        @Schema(example = "Bad Request")
        String error,

        String message,

        @Schema(description = "Request path that produced this error")
        String path,

        @Schema(description = "Per-field validation errors, present only for 400 validation failures")
        List<String> details
) {
}
