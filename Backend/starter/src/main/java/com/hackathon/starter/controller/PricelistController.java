package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.PricelistItemRequest;
import com.hackathon.starter.dto.request.PricelistRequest;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.PricelistItemResponse;
import com.hackathon.starter.dto.response.PricelistResponse;
import com.hackathon.starter.mapper.PricingMapper;
import com.hackathon.starter.service.PricelistService;
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

/** Admin-only (SecurityConfig: /api/pricelists/** requires ADMIN) - pricing is org config, not something customers browse directly. */
@RestController
@RequestMapping("/api/pricelists")
@Tag(name = "Pricelists", description = "Admin-only pricelist and price-rule management")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class PricelistController {

    private final PricelistService pricelistService;
    private final PricingMapper pricingMapper;

    public PricelistController(PricelistService pricelistService, PricingMapper pricingMapper) {
        this.pricelistService = pricelistService;
        this.pricingMapper = pricingMapper;
    }

    @GetMapping
    @Operation(summary = "List all pricelists")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Pricelists",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = PricelistResponse.class)))))
    public ResponseEntity<List<PricelistResponse>> list() {
        return ResponseEntity.ok(pricelistService.list().stream().map(pricingMapper::toResponse).toList());
    }

    @PostMapping
    @Operation(summary = "Create a pricelist")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Created",
                    content = @Content(schema = @Schema(implementation = PricelistResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<PricelistResponse> create(@Valid @RequestBody PricelistRequest request) {
        var pricelist = pricelistService.create(request.name(), request.validFrom(), request.validTo(), request.isDefault());
        return ResponseEntity.status(HttpStatus.CREATED).body(pricingMapper.toResponse(pricelist));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a pricelist")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated",
                    content = @Content(schema = @Schema(implementation = PricelistResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Pricelist not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<PricelistResponse> update(@PathVariable Long id, @Valid @RequestBody PricelistRequest request) {
        var pricelist = pricelistService.update(id, request.name(), request.validFrom(), request.validTo(), request.isDefault());
        return ResponseEntity.ok(pricingMapper.toResponse(pricelist));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a pricelist", description = "Cannot delete the default pricelist.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Deleted"),
            @ApiResponse(responseCode = "400", description = "Cannot delete the default pricelist",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Pricelist not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        pricelistService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/items")
    @Operation(summary = "Add a price rule (variant + duration unit + price) to a pricelist")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Created",
                    content = @Content(schema = @Schema(implementation = PricelistItemResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed or duplicate rule",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Pricelist or variant not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<PricelistItemResponse> addItem(@PathVariable Long id, @Valid @RequestBody PricelistItemRequest request) {
        var item = pricelistService.addItem(id, request.productVariantId(), request.durationUnit(), request.unitPrice());
        return ResponseEntity.status(HttpStatus.CREATED).body(pricingMapper.toResponse(item));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    @Operation(summary = "Remove a price rule from a pricelist")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Removed"),
            @ApiResponse(responseCode = "404", description = "Price rule not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> removeItem(@PathVariable Long id, @PathVariable Long itemId) {
        pricelistService.removeItem(id, itemId);
        return ResponseEntity.noContent().build();
    }
}
