package com.hackathon.starter.service;

import com.hackathon.starter.entity.StoredFile;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.StoredFileRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/**
 * Local-disk replacement for the (no longer used) storage-service module. Files live under
 * app.storage.root-dir/{ownerId or "shared"}/{fileId}/{fileName}; StoredFile is the DB-backed
 * metadata lookup. No auth/ownership logic lives here by design, matching storage-service's
 * original "dumb store" philosophy - callers (controllers/services) are the enforcement point,
 * exactly like they already were when storage-service was a separate app.
 */
@Service
public class FileStorageService {

    private final Path rootDir;
    private final StoredFileRepository storedFileRepository;

    public FileStorageService(@Value("${app.storage.root-dir}") String rootDir, StoredFileRepository storedFileRepository) {
        this.rootDir = Path.of(rootDir).toAbsolutePath().normalize();
        this.storedFileRepository = storedFileRepository;
    }

    @PostConstruct
    public void ensureRootDirExists() {
        try {
            Files.createDirectories(rootDir);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to create storage root directory: " + rootDir, e);
        }
    }

    @Transactional
    public StoredFile store(UUID ownerId, MultipartFile file) {
        try {
            return store(ownerId, file.getOriginalFilename(), file.getContentType(), file.getBytes());
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read uploaded file", e);
        }
    }

    @Transactional
    public StoredFile store(UUID ownerId, String fileName, String contentType, byte[] content) {
        UUID fileId = UUID.randomUUID();
        String safeFileName = sanitize(fileName);
        Path fileDir = rootDir.resolve(ownerId != null ? ownerId.toString() : "shared").resolve(fileId.toString());
        try {
            Files.createDirectories(fileDir);
            Path target = fileDir.resolve(safeFileName);
            Files.write(target, content);

            StoredFile stored = StoredFile.builder()
                    .id(fileId)
                    .ownerId(ownerId)
                    .originalFileName(safeFileName)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .sizeBytes(content.length)
                    .storagePath(rootDir.relativize(target).toString())
                    .build();
            return storedFileRepository.save(stored);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store file", e);
        }
    }

    public StoredFile getMetadata(UUID fileId) {
        return storedFileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
    }

    public byte[] loadBytes(UUID fileId) {
        StoredFile stored = getMetadata(fileId);
        try {
            return Files.readAllBytes(rootDir.resolve(stored.getStoragePath()));
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read stored file", e);
        }
    }

    private String sanitize(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "file";
        }
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
