package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.InvoiceResponse;
import com.hackathon.starter.entity.Invoice;
import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.mapper.InvoiceMapper;
import com.hackathon.starter.security.UserPrincipal;
import com.hackathon.starter.service.FileStorageService;
import com.hackathon.starter.service.InvoiceService;
import com.hackathon.starter.service.OrderAccessService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@Tag(name = "Invoices", description = "Downloadable rental/late-fee invoices")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoiceMapper invoiceMapper;
    private final OrderAccessService orderAccessService;
    private final FileStorageService fileStorageService;

    public InvoiceController(InvoiceService invoiceService, InvoiceMapper invoiceMapper,
                              OrderAccessService orderAccessService, FileStorageService fileStorageService) {
        this.invoiceService = invoiceService;
        this.invoiceMapper = invoiceMapper;
        this.orderAccessService = orderAccessService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/api/orders/{orderId}/invoices")
    @Operation(summary = "List invoices for an order", description = "Rental invoice plus any late-fee invoice.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Invoices",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = InvoiceResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Order not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<InvoiceResponse>> listForOrder(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID orderId) {
        RentalOrder order = orderAccessService.requireOwnedOrAdmin(principal, orderId);
        return ResponseEntity.ok(invoiceService.listForOrder(order.getId()).stream().map(invoiceMapper::toResponse).toList());
    }

    @GetMapping("/api/invoices/{id}/download")
    @Operation(summary = "Download an invoice PDF")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "PDF bytes"),
            @ApiResponse(responseCode = "404", description = "Invoice not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<byte[]> download(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        Invoice invoice = invoiceService.getById(id);
        orderAccessService.requireOwnedOrAdmin(principal, invoice.getOrder().getId());
        byte[] bytes = fileStorageService.loadBytes(invoice.getFileId());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoice-%s.pdf\"".formatted(invoice.getId()))
                .body(bytes);
    }
}
