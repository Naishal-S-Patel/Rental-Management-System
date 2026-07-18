package com.hackathon.storage_service.controller;

import com.hackathon.storage_service.dto.request.GenerateUploadUrlRequest;
import com.hackathon.storage_service.dto.response.DownloadUrlResponse;
import com.hackathon.storage_service.dto.response.ErrorResponse;
import com.hackathon.storage_service.dto.response.FileMetadataResponse;
import com.hackathon.storage_service.dto.response.UploadUrlResponse;
import com.hackathon.storage_service.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@Tag(name = "Files", description = "Local S3-like file storage - no auth, no encryption, no versioning")
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/upload-url")
    @Operation(summary = "Generate an upload URL",
            description = "Reserves a fileId and storage path, returning the resource URL to PUT the file's bytes to.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Upload URL generated",
                    content = @Content(schema = @Schema(implementation = UploadUrlResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<UploadUrlResponse> generateUploadUrl(@Valid @RequestBody GenerateUploadUrlRequest request) {
        return ResponseEntity.ok(fileStorageService.generateUploadUrl(request));
    }

    @PutMapping(value = "/{fileId}/content", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload the file's bytes",
            description = "multipart/form-data with a single 'file' part - must target a fileId from /upload-url.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Stored",
                    content = @Content(schema = @Schema(implementation = FileMetadataResponse.class))),
            @ApiResponse(responseCode = "404", description = "No upload was ever requested for this fileId",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<FileMetadataResponse> uploadFile(@PathVariable UUID fileId,
                                                            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(fileStorageService.storeFile(fileId, file));
    }

    @GetMapping("/{fileId}/download-url")
    @Operation(summary = "Generate a download URL",
            description = "Returns the resource URL to GET the file's bytes from. 404 if the file was never fully uploaded.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Download URL generated",
                    content = @Content(schema = @Schema(implementation = DownloadUrlResponse.class))),
            @ApiResponse(responseCode = "404", description = "Unknown or not-yet-uploaded fileId",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<DownloadUrlResponse> generateDownloadUrl(@PathVariable UUID fileId) {
        return ResponseEntity.ok(fileStorageService.generateDownloadUrl(fileId));
    }

    @GetMapping("/{fileId}/content")
    @Operation(summary = "Download the file's bytes")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "File bytes"),
            @ApiResponse(responseCode = "404", description = "Unknown or not-yet-uploaded fileId",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<FileSystemResource> downloadFile(@PathVariable UUID fileId) {
        var fileForDownload = fileStorageService.loadFileForDownload(fileId);
        var metadata = fileForDownload.metadata();

        String contentType = metadata.getContentType() != null
                ? metadata.getContentType()
                : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"%s\"".formatted(metadata.getOriginalFileName()))
                .body(new FileSystemResource(fileForDownload.path()));
    }
}
