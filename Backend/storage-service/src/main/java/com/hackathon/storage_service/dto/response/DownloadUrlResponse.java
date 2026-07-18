package com.hackathon.storage_service.dto.response;

import java.util.UUID;

public record DownloadUrlResponse(
        UUID fileId,
        String downloadUrl
) {
}
