package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.entity.StoredFile;
import com.hackathon.starter.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Generic authenticated download for product images / profile photos / damage-report photos -
 * invoices have their own ownership-checked endpoint (InvoiceController) instead of this one.
 * No per-file ownership check here by design: matches the original storage-service's "dumb
 * store" philosophy, where the real access-control boundary is whichever endpoint handed the
 * fileId out in the first place (product detail is visible to any authenticated user, damage
 * reports only ever appear in admin-only responses, etc).
 */
@RestController
@RequestMapping("/api/files")
@Tag(name = "Files", description = "Locally-stored images/photos - authenticated download")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/{fileId}")
    @Operation(summary = "Download a stored file's bytes")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "File bytes"),
            @ApiResponse(responseCode = "404", description = "File not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<byte[]> download(@PathVariable UUID fileId) {
        StoredFile metadata = fileStorageService.getMetadata(fileId);
        byte[] bytes = fileStorageService.loadBytes(fileId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(metadata.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"%s\"".formatted(metadata.getOriginalFileName()))
                .body(bytes);
    }
}
