package com.hackathon.starter.mapper;

import com.hackathon.starter.dto.response.QuotationLineResponse;
import com.hackathon.starter.dto.response.QuotationResponse;
import com.hackathon.starter.dto.response.QuotationTemplateResponse;
import com.hackathon.starter.entity.Quotation;
import com.hackathon.starter.entity.QuotationLine;
import com.hackathon.starter.entity.QuotationTemplate;
import com.hackathon.starter.repository.RentalOrderRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class QuotationMapper {

    private final RentalOrderRepository rentalOrderRepository;

    public QuotationMapper(RentalOrderRepository rentalOrderRepository) {
        this.rentalOrderRepository = rentalOrderRepository;
    }

    public QuotationLineResponse toResponse(QuotationLine line) {
        return new QuotationLineResponse(line.getId(), line.getProductVariant().getId(),
                line.getProductVariant().getProduct().getName(), line.getQuantity(),
                line.getStartDate(), line.getEndDate(), line.getUnitPrice(), line.getLineTotal());
    }

    public QuotationTemplateResponse toResponse(QuotationTemplate template) {
        return new QuotationTemplateResponse(template.getId(), template.getName(), template.getHeader(),
                template.getFooter(), template.getTerms());
    }

    public QuotationResponse toResponse(Quotation quotation) {
        var lines = quotation.getLines().stream().map(this::toResponse).toList();
        BigDecimal subtotal = lines.stream().map(QuotationLineResponse::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        var orderId = rentalOrderRepository.findByQuotationId(quotation.getId()).map(o -> o.getId()).orElse(null);
        return new QuotationResponse(
                quotation.getId(), quotation.getCustomer().getId(),
                (quotation.getCustomer().getFirstName() + " " + quotation.getCustomer().getLastName()).trim(),
                quotation.getQuotationTemplate() != null ? quotation.getQuotationTemplate().getId() : null,
                quotation.getStatus(), quotation.getValidUntil(), lines, subtotal, orderId, quotation.getCreatedAt());
    }
}
