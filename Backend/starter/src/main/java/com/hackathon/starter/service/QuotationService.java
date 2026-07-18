package com.hackathon.starter.service;

import com.hackathon.starter.dto.request.QuotationLineRequest;
import com.hackathon.starter.entity.ProductVariant;
import com.hackathon.starter.entity.Quotation;
import com.hackathon.starter.entity.QuotationLine;
import com.hackathon.starter.entity.QuotationTemplate;
import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.entity.User;
import com.hackathon.starter.enums.QuotationStatus;
import com.hackathon.starter.exception.BadRequestException;
import com.hackathon.starter.exception.InvalidOrderStateException;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.ProductVariantRepository;
import com.hackathon.starter.repository.QuotationRepository;
import com.hackathon.starter.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * In-store, admin-initiated quotations (PRD_README.md §4.3). Confirming a quotation IS the
 * admin-confirmation step - it skips PENDING_ADMIN_CONFIRMATION entirely and produces a
 * RentalOrder already in CONFIRMED (see OrderService.createFromQuotation).
 */
@Service
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;
    private final QuotationTemplateService quotationTemplateService;
    private final PricingService pricingService;
    private final OrderService orderService;

    public QuotationService(QuotationRepository quotationRepository, ProductVariantRepository productVariantRepository,
                             UserRepository userRepository, QuotationTemplateService quotationTemplateService,
                             PricingService pricingService, OrderService orderService) {
        this.quotationRepository = quotationRepository;
        this.productVariantRepository = productVariantRepository;
        this.userRepository = userRepository;
        this.quotationTemplateService = quotationTemplateService;
        this.pricingService = pricingService;
        this.orderService = orderService;
    }

    public Quotation getById(UUID id) {
        return quotationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Quotation not found"));
    }

    public Page<Quotation> list(QuotationStatus status, Pageable pageable) {
        return status != null ? quotationRepository.findByStatus(status, pageable) : quotationRepository.findAll(pageable);
    }

    @Transactional
    public Quotation create(UUID customerId, Long quotationTemplateId, LocalDate validUntil,
                             List<QuotationLineRequest> lineRequests, User createdBy) {
        User customer = userRepository.findById(customerId).orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        QuotationTemplate template = quotationTemplateId != null ? quotationTemplateService.getById(quotationTemplateId) : null;

        Quotation quotation = Quotation.builder()
                .customer(customer).quotationTemplate(template).createdBy(createdBy)
                .status(QuotationStatus.SENT).validUntil(validUntil).lines(new ArrayList<>())
                .build();

        applyLines(quotation, lineRequests);
        return quotationRepository.save(quotation);
    }

    @Transactional
    public Quotation update(UUID id, Long quotationTemplateId, LocalDate validUntil, List<QuotationLineRequest> lineRequests) {
        Quotation quotation = getById(id);
        requireEditable(quotation);
        quotation.setQuotationTemplate(quotationTemplateId != null ? quotationTemplateService.getById(quotationTemplateId) : null);
        quotation.setValidUntil(validUntil);
        quotation.getLines().clear();
        applyLines(quotation, lineRequests);
        return quotationRepository.save(quotation);
    }

    private void applyLines(Quotation quotation, List<QuotationLineRequest> lineRequests) {
        for (QuotationLineRequest req : lineRequests) {
            if (!req.endDate().isAfter(req.startDate())) {
                throw new BadRequestException("endDate must be after startDate");
            }
            ProductVariant variant = productVariantRepository.findById(req.productVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product variant not found"));
            var pricing = pricingService.resolveLinePricing(req.productVariantId(), req.startDate(), req.endDate(),
                    null, req.quantity());
            quotation.getLines().add(QuotationLine.builder()
                    .quotation(quotation).productVariant(variant).quantity(req.quantity())
                    .startDate(req.startDate()).endDate(req.endDate())
                    .unitPrice(pricing.unitPrice()).lineTotal(pricing.lineTotal())
                    .build());
        }
    }

    /** Converts the quotation into a CONFIRMED RentalOrder - this call is itself the admin confirmation. */
    @Transactional
    public RentalOrder confirm(UUID id, User admin) {
        Quotation quotation = getById(id);
        requireEditable(quotation);
        quotation.setStatus(QuotationStatus.CONFIRMED);
        quotationRepository.save(quotation);
        return orderService.createFromQuotation(quotation, admin);
    }

    @Transactional
    public Quotation reject(UUID id) {
        Quotation quotation = getById(id);
        requireEditable(quotation);
        quotation.setStatus(QuotationStatus.REJECTED);
        return quotationRepository.save(quotation);
    }

    private void requireEditable(Quotation quotation) {
        if (quotation.getStatus() != QuotationStatus.DRAFT && quotation.getStatus() != QuotationStatus.SENT) {
            throw new InvalidOrderStateException("Quotation can no longer be modified (status: %s)".formatted(quotation.getStatus()));
        }
    }
}
