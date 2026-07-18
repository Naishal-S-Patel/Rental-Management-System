package com.hackathon.starter.dto.request;

import jakarta.validation.constraints.Size;

public record OrderRejectRequest(
        @Size(max = 255)
        String reason
) {
}
