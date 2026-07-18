package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.QuotationTemplateRequest;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.QuotationTemplateResponse;
import com.hackathon.starter.mapper.QuotationMapper;
import com.hackathon.starter.service.QuotationTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** ADMIN-only (SecurityConfig, grouped with /api/quotations/**). */
@RestController
@RequestMapping("/api/quotation-templates")
@Tag(name = "Quotation Templates", description = "Admin-only reusable header/footer/terms templates for fast quotation creation")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class QuotationTemplateController {

    private final QuotationTemplateService quotationTemplateService;
    private final QuotationMapper quotationMapper;

    public QuotationTemplateController(QuotationTemplateService quotationTemplateService, QuotationMapper quotationMapper) {
        this.quotationTemplateService = quotationTemplateService;
        this.quotationMapper = quotationMapper;
    }

    @GetMapping
    @Operation(summary = "List quotation templates")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Templates",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = QuotationTemplateResponse.class)))))
    public ResponseEntity<List<QuotationTemplateResponse>> list() {
        return ResponseEntity.ok(quotationTemplateService.list().stream().map(quotationMapper::toResponse).toList());
    }

    @PostMapping
    @Operation(summary = "Create a quotation template")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Created",
                    content = @Content(schema = @Schema(implementation = QuotationTemplateResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<QuotationTemplateResponse> create(@Valid @RequestBody QuotationTemplateRequest request) {
        var template = quotationTemplateService.create(request.name(), request.header(), request.footer(), request.terms());
        return ResponseEntity.status(HttpStatus.CREATED).body(quotationMapper.toResponse(template));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a quotation template")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated",
                    content = @Content(schema = @Schema(implementation = QuotationTemplateResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<QuotationTemplateResponse> update(@PathVariable Long id, @Valid @RequestBody QuotationTemplateRequest request) {
        var template = quotationTemplateService.update(id, request.name(), request.header(), request.footer(), request.terms());
        return ResponseEntity.ok(quotationMapper.toResponse(template));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a quotation template")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Deleted"),
            @ApiResponse(responseCode = "404", description = "Not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        quotationTemplateService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
