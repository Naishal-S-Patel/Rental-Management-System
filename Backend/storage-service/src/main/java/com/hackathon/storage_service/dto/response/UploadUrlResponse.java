package com.hackathon.storage_service.dto.response;

import java.util.UUID;

public record UploadUrlResponse(
        UUID fileId,
        String uploadUrl
) {
}
