package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.ProductRequest;
import com.hackathon.starter.dto.request.ProductVariantRequest;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.ProductResponse;
import com.hackathon.starter.dto.response.ProductVariantResponse;
import com.hackathon.starter.mapper.ProductMapper;
import com.hackathon.starter.security.UserPrincipal;
import com.hackathon.starter.service.FileStorageService;
import com.hackathon.starter.service.ProductService;
import com.hackathon.starter.service.ProductVariantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@Tag(name = "Products", description = "Rental product catalog - browse (any authenticated user), manage (ADMIN only)")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class ProductController {

    private final ProductService productService;
    private final ProductVariantService productVariantService;
    private final ProductMapper productMapper;
    private final FileStorageService fileStorageService;

    public ProductController(ProductService productService, ProductVariantService productVariantService,
                              ProductMapper productMapper, FileStorageService fileStorageService) {
        this.productService = productService;
        this.productVariantService = productVariantService;
        this.productMapper = productMapper;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    @Operation(summary = "Browse/search products", description = "Filter by category and/or free-text name search, paginated.")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Products",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ProductResponse.class)))))
    public ResponseEntity<Page<ProductResponse>> search(@RequestParam(required = false) String category,
                                                          @RequestParam(required = false) String search,
                                                          Pageable pageable) {
        return ResponseEntity.ok(productService.search(category, search, pageable).map(productMapper::toResponse));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a product's detail, including variants")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Product",
                    content = @Content(schema = @Schema(implementation = ProductResponse.class))),
            @ApiResponse(responseCode = "404", description = "Product not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ProductResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(productMapper.toResponse(productService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Create a product")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Created",
                    content = @Content(schema = @Schema(implementation = ProductResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        var product = productService.create(request.name(), request.description(), request.category(),
                request.basePrice(), request.securityDepositAmount());
        return ResponseEntity.status(HttpStatus.CREATED).body(productMapper.toResponse(product));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a product")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated",
                    content = @Content(schema = @Schema(implementation = ProductResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Product not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ProductResponse> update(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        var product = productService.update(id, request.name(), request.description(), request.category(),
                request.basePrice(), request.securityDepositAmount());
        return ResponseEntity.ok(productMapper.toResponse(product));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate a product", description = "Soft-delete only - never hard-deleted, since past orders reference it.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Deactivated"),
            @ApiResponse(responseCode = "403", description = "Not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Product not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        productService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/images")
    @Operation(summary = "Upload a product image", description = "multipart/form-data with a single 'file' part - stored locally on disk.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated product",
                    content = @Content(schema = @Schema(implementation = ProductResponse.class))),
            @ApiResponse(responseCode = "403", description = "Not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Product not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ProductResponse> uploadImage(@AuthenticationPrincipal UserPrincipal principal,
                                                         @PathVariable UUID id,
                                                         @RequestParam("file") MultipartFile file) {
        var stored = fileStorageService.store(principal.getId(), file);
        int nextSortOrder = productService.listImages(id).size();
        productService.addImage(id, stored.getId(), nextSortOrder);
        return ResponseEntity.ok(productMapper.toResponse(productService.getById(id)));
    }

    @GetMapping("/{id}/variants")
    @Operation(summary = "List a product's variants with per-variant stock")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Variants",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ProductVariantResponse.class)))))
    public ResponseEntity<List<ProductVariantResponse>> listVariants(@PathVariable UUID id) {
        return ResponseEntity.ok(productVariantService.listByProduct(id).stream().map(productMapper::toResponse).toList());
    }

    @PostMapping("/{id}/variants")
    @Operation(summary = "Create a variant (attribute value combo + stock quantity)")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Created",
                    content = @Content(schema = @Schema(implementation = ProductVariantResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Product or attribute value not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ProductVariantResponse> createVariant(@PathVariable UUID id, @Valid @RequestBody ProductVariantRequest request) {
        var variant = productVariantService.create(id, request.sku(), request.totalQuantity(), request.attributeValueIds());
        return ResponseEntity.status(HttpStatus.CREATED).body(productMapper.toResponse(variant));
    }
}
