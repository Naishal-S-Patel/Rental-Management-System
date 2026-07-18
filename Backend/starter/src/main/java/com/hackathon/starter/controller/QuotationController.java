package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.QuotationRequest;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.OrderResponse;
import com.hackathon.starter.dto.response.QuotationResponse;
import com.hackathon.starter.entity.User;
import com.hackathon.starter.enums.QuotationStatus;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.mapper.OrderMapper;
import com.hackathon.starter.mapper.QuotationMapper;
import com.hackathon.starter.repository.UserRepository;
import com.hackathon.starter.security.UserPrincipal;
import com.hackathon.starter.service.QuotationService;
import io.swagger.v3.oas.annotations.Operation;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** ADMIN-only (SecurityConfig) - in-store, admin-initiated quotations for walk-in rentals. */
@RestController
@RequestMapping("/api/quotations")
@Tag(name = "Quotations", description = "Admin-only in-store quotation workflow")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class QuotationController {

    private final QuotationService quotationService;
    private final QuotationMapper quotationMapper;
    private final OrderMapper orderMapper;
    private final UserRepository userRepository;

    public QuotationController(QuotationService quotationService, QuotationMapper quotationMapper,
                                OrderMapper orderMapper, UserRepository userRepository) {
        this.quotationService = quotationService;
        this.quotationMapper = quotationMapper;
        this.orderMapper = orderMapper;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "List quotations, optionally filtered by status")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Quotations",
            content = @Content(schema = @Schema(implementation = QuotationResponse.class))))
    public ResponseEntity<Page<QuotationResponse>> list(@RequestParam(required = false) QuotationStatus status, Pageable pageable) {
        return ResponseEntity.ok(quotationService.list(status, pageable).map(quotationMapper::toResponse));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a quotation's detail")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Quotation",
                    content = @Content(schema = @Schema(implementation = QuotationResponse.class))),
            @ApiResponse(responseCode = "404", description = "Not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<QuotationResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(quotationMapper.toResponse(quotationService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Create a quotation for a customer", description = "Customer must already have an account (self-registered or otherwise); the id is looked up by UUID.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Created",
                    content = @Content(schema = @Schema(implementation = QuotationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Customer, template, or variant not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<QuotationResponse> create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody QuotationRequest request) {
        User admin = userRepository.findById(principal.getId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        var quotation = quotationService.create(request.customerId(), request.quotationTemplateId(),
                request.validUntil(), request.lines(), admin);
        return ResponseEntity.status(HttpStatus.CREATED).body(quotationMapper.toResponse(quotation));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edit a quotation's lines", description = "Only while DRAFT or SENT.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated",
                    content = @Content(schema = @Schema(implementation = QuotationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Quotation can no longer be modified",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<QuotationResponse> update(@PathVariable UUID id, @Valid @RequestBody QuotationRequest request) {
        var quotation = quotationService.update(id, request.quotationTemplateId(), request.validUntil(), request.lines());
        return ResponseEntity.ok(quotationMapper.toResponse(quotation));
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Confirm a quotation", description = "This IS the admin-confirmation step - produces a RentalOrder already CONFIRMED, with its invoice generated.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order created",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class))),
            @ApiResponse(responseCode = "400", description = "Out of stock",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Quotation can no longer be confirmed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<OrderResponse> confirm(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        User admin = userRepository.findById(principal.getId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(orderMapper.toResponse(quotationService.confirm(id, admin)));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject a quotation")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rejected",
                    content = @Content(schema = @Schema(implementation = QuotationResponse.class))),
            @ApiResponse(responseCode = "404", description = "Not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Quotation can no longer be rejected",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<QuotationResponse> reject(@PathVariable UUID id) {
        return ResponseEntity.ok(quotationMapper.toResponse(quotationService.reject(id)));
    }
}
