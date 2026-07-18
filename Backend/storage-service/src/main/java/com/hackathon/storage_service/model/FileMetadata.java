package com.hackathon.storage_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Plain model backing the file_metadata table - not a JPA entity. Metadata is read/written via
 * hand-written JdbcTemplate SQL (see FileMetadataRepository), not Hibernate, to avoid depending
 * on SQLite's community Hibernate dialect for what's otherwise a handful of simple queries.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
public class FileMetadata {
    private UUID id;
    private String userId;
    private String originalFileName;
    private String contentType;
    private String storagePath;
    private Long sizeBytes;
    private FileStatus status;
    private Instant createdAt;
}
