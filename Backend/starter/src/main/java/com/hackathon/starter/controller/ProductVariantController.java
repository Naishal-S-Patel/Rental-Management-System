package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.ProductVariantRequest;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.ProductVariantResponse;
import com.hackathon.starter.mapper.ProductMapper;
import com.hackathon.starter.service.ProductVariantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/variants")
@Tag(name = "Product Variants", description = "Update/delete a specific variant by id (ADMIN only)")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class ProductVariantController {

    private final ProductVariantService productVariantService;
    private final ProductMapper productMapper;

    public ProductVariantController(ProductVariantService productVariantService, ProductMapper productMapper) {
        this.productVariantService = productVariantService;
        this.productMapper = productMapper;
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a variant's SKU, quantity, or attribute combination")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated",
                    content = @Content(schema = @Schema(implementation = ProductVariantResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Variant not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ProductVariantResponse> update(@PathVariable UUID id, @Valid @RequestBody ProductVariantRequest request) {
        var variant = productVariantService.update(id, request.sku(), request.totalQuantity(), request.attributeValueIds());
        return ResponseEntity.ok(productMapper.toResponse(variant));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate a variant", description = "Soft-delete only.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Deactivated"),
            @ApiResponse(responseCode = "403", description = "Not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Variant not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        productVariantService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
