package com.hackathon.storage_service.dto.response;

import com.hackathon.storage_service.model.FileStatus;

import java.time.Instant;
import java.util.UUID;

public record FileMetadataResponse(
        UUID fileId,
        String userId,
        String originalFileName,
        String contentType,
        long sizeBytes,
        FileStatus status,
        Instant createdAt
) {
}
