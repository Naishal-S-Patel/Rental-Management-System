package com.hackathon.storage_service.repository;

import com.hackathon.storage_service.model.FileMetadata;
import com.hackathon.storage_service.model.FileStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Plain JdbcTemplate repository - deliberately not Spring Data JPA, see FileMetadata's javadoc
 * for why. Just enough queries to support the four endpoints in FileController.
 */
@Repository
public class FileMetadataRepository {

    private static final RowMapper<FileMetadata> ROW_MAPPER = (rs, rowNum) -> FileMetadata.builder()
            .id(UUID.fromString(rs.getString("id")))
            .userId(rs.getString("user_id"))
            .originalFileName(rs.getString("original_file_name"))
            .contentType(rs.getString("content_type"))
            .storagePath(rs.getString("storage_path"))
            .sizeBytes(rs.getObject("size_bytes") != null ? rs.getLong("size_bytes") : null)
            .status(FileStatus.valueOf(rs.getString("status")))
            .createdAt(Instant.parse(rs.getString("created_at")))
            .build();

    private final JdbcTemplate jdbcTemplate;

    public FileMetadataRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void insertPending(FileMetadata metadata) {
        jdbcTemplate.update(
                """
                INSERT INTO file_metadata
                    (id, user_id, original_file_name, content_type, storage_path, size_bytes, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                metadata.getId().toString(),
                metadata.getUserId(),
                metadata.getOriginalFileName(),
                metadata.getContentType(),
                metadata.getStoragePath(),
                metadata.getSizeBytes(),
                metadata.getStatus().name(),
                metadata.getCreatedAt().toString());
    }

    public void markUploaded(UUID id, long sizeBytes, String contentType) {
        jdbcTemplate.update(
                "UPDATE file_metadata SET status = ?, size_bytes = ?, content_type = ? WHERE id = ?",
                FileStatus.UPLOADED.name(), sizeBytes, contentType, id.toString());
    }

    public Optional<FileMetadata> findById(UUID id) {
        return jdbcTemplate.query("SELECT * FROM file_metadata WHERE id = ?", ROW_MAPPER, id.toString())
                .stream()
                .findFirst();
    }
}
