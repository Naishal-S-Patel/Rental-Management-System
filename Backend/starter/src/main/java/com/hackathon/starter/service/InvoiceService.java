package com.hackathon.starter.service;

import com.hackathon.starter.entity.Invoice;
import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.enums.InvoiceType;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.InvoiceRepository;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Renders a Thymeleaf template to XHTML, converts to a PDF via openhtmltopdf, stores it locally
 * via FileStorageService (scoped to the order's customer), and records an Invoice row. Reuses
 * the same shared TemplateEngine bean the email pipeline already uses - see EmailServiceImpl.
 */
@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final TemplateEngine templateEngine;
    private final FileStorageService fileStorageService;

    public InvoiceService(InvoiceRepository invoiceRepository, TemplateEngine templateEngine, FileStorageService fileStorageService) {
        this.invoiceRepository = invoiceRepository;
        this.templateEngine = templateEngine;
        this.fileStorageService = fileStorageService;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class LineView {
        private String productName;
        private int quantity;
        private String startDate;
        private String endDate;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }

    public List<Invoice> listForOrder(UUID orderId) {
        return invoiceRepository.findByOrderIdOrderByIssuedAtDesc(orderId);
    }

    public Invoice getById(UUID id) {
        return invoiceRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
    }

    /** RENTAL invoice - full order line breakdown, generated at admin confirmation. */
    @Transactional
    public Invoice generateRentalInvoice(RentalOrder order) {
        List<LineView> lines = order.getLines().stream()
                .map(line -> new LineView(
                        line.getProductVariant().getProduct().getName(), line.getQuantity(),
                        line.getStartDate().toString(), line.getEndDate().toString(),
                        line.getUnitPrice(), line.getLineTotal()))
                .toList();
        return generate(order, InvoiceType.RENTAL, order.getTotalAmount(), lines);
    }

    /** LATE_FEE invoice - a single synthetic line for the penalty (deducted or outstanding portion), generated at return settlement. */
    @Transactional
    public Invoice generateLateFeeInvoice(RentalOrder order, BigDecimal amount) {
        List<LineView> lines = List.of(new LineView(
                "Late return penalty", 1, "", "", amount, amount));
        return generate(order, InvoiceType.LATE_FEE, amount, lines);
    }

    private Invoice generate(RentalOrder order, InvoiceType type, BigDecimal amount, List<LineView> lines) {
        Context context = new Context();
        context.setVariable("orgName", "Rental Management System");
        context.setVariable("invoiceId", UUID.randomUUID().toString());
        context.setVariable("invoiceType", type.name());
        context.setVariable("issuedAt", LocalDateTime.now().toString());
        context.setVariable("customerName", (order.getCustomer().getFirstName() + " " + order.getCustomer().getLastName()).trim());
        context.setVariable("customerEmail", order.getCustomer().getEmail());
        context.setVariable("orderId", order.getId().toString());
        context.setVariable("fulfillmentMethod", order.getFulfillmentMethod().name());
        context.setVariable("lines", lines);
        context.setVariable("subtotalAmount", order.getSubtotalAmount());
        context.setVariable("depositAmount", order.getDepositAmount());
        context.setVariable("amount", amount);

        String xhtml = templateEngine.process("invoice/invoice", context);
        byte[] pdfBytes = renderPdf(xhtml);

        UUID customerId = order.getCustomer().getId();
        String fileName = "invoice-%s-%s.pdf".formatted(type.name().toLowerCase(), order.getId());
        var stored = fileStorageService.store(customerId, fileName, MediaType.APPLICATION_PDF_VALUE, pdfBytes);

        Invoice invoice = Invoice.builder()
                .order(order).type(type).fileId(stored.getId()).amount(amount).issuedAt(LocalDateTime.now())
                .build();
        return invoiceRepository.save(invoice);
    }

    private byte[] renderPdf(String xhtml) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(xhtml, null);
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to render invoice PDF", e);
        }
    }
}
