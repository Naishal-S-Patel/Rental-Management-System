package com.hackathon.starter.mapper;

import com.hackathon.starter.dto.response.InvoiceResponse;
import com.hackathon.starter.entity.Invoice;
import org.springframework.stereotype.Component;

@Component
public class InvoiceMapper {

    public InvoiceResponse toResponse(Invoice invoice) {
        return new InvoiceResponse(invoice.getId(), invoice.getOrder().getId(), invoice.getType(),
                invoice.getAmount(), invoice.getIssuedAt());
    }
}
