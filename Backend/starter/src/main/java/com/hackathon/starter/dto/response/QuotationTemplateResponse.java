package com.hackathon.starter.dto.response;

public record QuotationTemplateResponse(
        Long id,
        String name,
        String header,
        String footer,
        String terms
) {
}
