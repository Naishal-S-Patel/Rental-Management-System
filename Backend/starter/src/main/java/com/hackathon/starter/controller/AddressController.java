package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.AddressRequest;
import com.hackathon.starter.dto.response.AddressResponse;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.mapper.AddressMapper;
import com.hackathon.starter.security.UserPrincipal;
import com.hackathon.starter.service.AddressService;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/addresses")
@Tag(name = "Addresses", description = "Authenticated user's own shipping/delivery addresses")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class AddressController {

    private final AddressService addressService;
    private final AddressMapper addressMapper;

    public AddressController(AddressService addressService, AddressMapper addressMapper) {
        this.addressService = addressService;
        this.addressMapper = addressMapper;
    }

    @GetMapping
    @Operation(summary = "List the current user's addresses")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Addresses",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = AddressResponse.class)))))
    public ResponseEntity<List<AddressResponse>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(addressService.listForUser(principal.getId()).stream().map(addressMapper::toResponse).toList());
    }

    @PostMapping
    @Operation(summary = "Add an address", description = "The first address a user adds automatically becomes their default.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Created",
                    content = @Content(schema = @Schema(implementation = AddressResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AddressResponse> create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody AddressRequest request) {
        var address = addressService.create(principal.getId(), request.label(), request.line1(), request.line2(),
                request.city(), request.state(), request.postalCode(), request.country());
        return ResponseEntity.status(HttpStatus.CREATED).body(addressMapper.toResponse(address));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update one of the current user's addresses")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated",
                    content = @Content(schema = @Schema(implementation = AddressResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Address not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AddressResponse> update(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id,
                                                    @Valid @RequestBody AddressRequest request) {
        var address = addressService.update(id, principal.getId(), request.label(), request.line1(), request.line2(),
                request.city(), request.state(), request.postalCode(), request.country());
        return ResponseEntity.ok(addressMapper.toResponse(address));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove one of the current user's addresses")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Removed"),
            @ApiResponse(responseCode = "404", description = "Address not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        addressService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/default")
    @Operation(summary = "Mark an address as the default shipping address")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated",
                    content = @Content(schema = @Schema(implementation = AddressResponse.class))),
            @ApiResponse(responseCode = "404", description = "Address not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AddressResponse> markDefault(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(addressMapper.toResponse(addressService.markDefault(id, principal.getId())));
    }
}
