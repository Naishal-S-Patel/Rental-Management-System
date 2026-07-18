package com.hackathon.starter.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Local replacement for the (no longer used) storage-service module - files live on disk under
 * app.storage.root-dir, this row is just the metadata lookup (content type, original name, path)
 * keyed by the same UUID every other entity's "*FileId" column already points at, so nothing
 * downstream of ProductImage/DamageReportPhoto/Invoice/User.profileImageFileId had to change
 * shape. id is manually assigned (not @GeneratedValue) so the disk path can be computed before
 * the row is persisted.
 */
@Entity
@Table(name = "stored_files", indexes = @Index(name = "idx_stored_files_owner_id", columnList = "owner_id"))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoredFile {

    @Id
    private UUID id;

    /** Whoever the file "belongs" to (customer id, or null for admin-owned catalog assets) - informational only, no FK. */
    @Column(name = "owner_id")
    private UUID ownerId;

    @Column(name = "original_file_name", nullable = false)
    private String originalFileName;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    /** Path relative to app.storage.root-dir. */
    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
