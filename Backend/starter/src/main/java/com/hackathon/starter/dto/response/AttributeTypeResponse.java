package com.hackathon.starter.dto.response;

import java.util.List;

public record AttributeTypeResponse(
        Long id,
        String name,
        List<AttributeValueResponse> values
) {
}
