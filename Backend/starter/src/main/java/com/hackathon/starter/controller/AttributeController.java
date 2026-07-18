package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.AttributeTypeRequest;
import com.hackathon.starter.dto.request.AttributeValueRequest;
import com.hackathon.starter.dto.response.AttributeTypeResponse;
import com.hackathon.starter.dto.response.AttributeValueResponse;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.mapper.AttributeMapper;
import com.hackathon.starter.service.AttributeService;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Admin-only catalog config: attribute types (Brand, Manufacturer, Color, Size...) and their values - PDF §5. */
@RestController
@RequestMapping("/api/attributes")
@Tag(name = "Attributes", description = "Admin-only product attribute types/values (Brand, Color, Size...)")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class AttributeController {

    private final AttributeService attributeService;
    private final AttributeMapper attributeMapper;

    public AttributeController(AttributeService attributeService, AttributeMapper attributeMapper) {
        this.attributeService = attributeService;
        this.attributeMapper = attributeMapper;
    }

    @GetMapping
    @Operation(summary = "List all attribute types with their values")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Attribute types",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = AttributeTypeResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Not authenticated",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<AttributeTypeResponse>> listTypes() {
        return ResponseEntity.ok(attributeService.listTypes().stream().map(attributeMapper::toResponse).toList());
    }

    @PostMapping
    @Operation(summary = "Create a new attribute type")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Created",
                    content = @Content(schema = @Schema(implementation = AttributeTypeResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed or duplicate name",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Not authenticated",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AttributeTypeResponse> createType(@Valid @RequestBody AttributeTypeRequest request) {
        var type = attributeService.createType(request.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(attributeMapper.toResponse(type));
    }

    @PostMapping("/{id}/values")
    @Operation(summary = "Add a value to an attribute type")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Created",
                    content = @Content(schema = @Schema(implementation = AttributeValueResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Not authenticated",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Attribute type not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AttributeValueResponse> addValue(@PathVariable Long id, @Valid @RequestBody AttributeValueRequest request) {
        var value = attributeService.addValue(id, request.value());
        return ResponseEntity.status(HttpStatus.CREATED).body(attributeMapper.toResponse(value));
    }
}
