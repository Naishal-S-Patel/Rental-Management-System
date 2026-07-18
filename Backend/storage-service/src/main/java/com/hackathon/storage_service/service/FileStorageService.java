package com.hackathon.storage_service.service;

import com.hackathon.storage_service.config.StorageProperties;
import com.hackathon.storage_service.dto.request.GenerateUploadUrlRequest;
import com.hackathon.storage_service.dto.response.DownloadUrlResponse;
import com.hackathon.storage_service.dto.response.FileMetadataResponse;
import com.hackathon.storage_service.dto.response.UploadUrlResponse;
import com.hackathon.storage_service.exception.FileNotFoundStorageException;
import com.hackathon.storage_service.model.FileMetadata;
import com.hackathon.storage_service.model.FileStatus;
import com.hackathon.storage_service.repository.FileMetadataRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.UUID;

/**
 * Owns all disk I/O plus orchestrates the metadata repository. Physical layout on disk:
 * {storage.root-dir}/users/{userId}/{fileId}/{originalFileName} - see the plan doc for why
 * (mirrors the requested users/123/file.pdf shape, with a UUID subfolder to avoid collisions).
 *
 * "Generate upload/download URL" deliberately just returns the real REST resource URL for the
 * file (e.g. /api/files/{fileId}/content) rather than a signed/expiring token - there's no auth
 * or security model here to back a real presigned URL with, so a two-step "generate then use"
 * shape is all that's needed to mirror S3's UX.
 */
@Service
public class FileStorageService {

    private final FileMetadataRepository repository;
    private final StorageProperties storageProperties;

    public FileStorageService(FileMetadataRepository repository, StorageProperties storageProperties) {
        this.repository = repository;
        this.storageProperties = storageProperties;
    }

    public UploadUrlResponse generateUploadUrl(GenerateUploadUrlRequest request) {
        UUID fileId = UUID.randomUUID();
        String relativePath = "users/%s/%s/%s".formatted(request.userId(), fileId, request.fileName());

        FileMetadata metadata = FileMetadata.builder()
                .id(fileId)
                .userId(request.userId())
                .originalFileName(request.fileName())
                .contentType(request.contentType())
                .storagePath(relativePath)
                .sizeBytes(0L)
                .status(FileStatus.PENDING)
                .createdAt(Instant.now())
                .build();
        repository.insertPending(metadata);

        return new UploadUrlResponse(fileId, "/api/files/%s/content".formatted(fileId));
    }

    public FileMetadataResponse storeFile(UUID fileId, MultipartFile file) throws IOException {
        FileMetadata metadata = repository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundStorageException("No upload was ever requested for file " + fileId));

        Path destination = storageProperties.resolveRootPath().resolve(metadata.getStoragePath());
        Files.createDirectories(destination.getParent());
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
        }

        String contentType = file.getContentType() != null ? file.getContentType() : metadata.getContentType();
        long sizeBytes = Files.size(destination);
        repository.markUploaded(fileId, sizeBytes, contentType);

        return new FileMetadataResponse(
                fileId, metadata.getUserId(), metadata.getOriginalFileName(), contentType, sizeBytes,
                FileStatus.UPLOADED, metadata.getCreatedAt());
    }

    public DownloadUrlResponse generateDownloadUrl(UUID fileId) {
        FileMetadata metadata = requireUploaded(fileId);
        return new DownloadUrlResponse(fileId, "/api/files/%s/content".formatted(metadata.getId()));
    }

    /** Returns the metadata plus the on-disk path to stream - the controller does the actual streaming. */
    public FileForDownload loadFileForDownload(UUID fileId) {
        FileMetadata metadata = requireUploaded(fileId);
        Path path = storageProperties.resolveRootPath().resolve(metadata.getStoragePath());
        if (!Files.exists(path)) {
            throw new FileNotFoundStorageException("File metadata exists but bytes are missing on disk: " + fileId);
        }
        return new FileForDownload(metadata, path);
    }

    private FileMetadata requireUploaded(UUID fileId) {
        FileMetadata metadata = repository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundStorageException("No such file: " + fileId));
        if (metadata.getStatus() != FileStatus.UPLOADED) {
            throw new FileNotFoundStorageException("File " + fileId + " was never fully uploaded");
        }
        return metadata;
    }

    public record FileForDownload(FileMetadata metadata, Path path) {
    }
}
