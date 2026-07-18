package com.hackathon.starter.mapper;

import com.hackathon.starter.dto.response.AttributeTypeResponse;
import com.hackathon.starter.dto.response.AttributeValueResponse;
import com.hackathon.starter.entity.AttributeType;
import com.hackathon.starter.entity.AttributeValue;
import com.hackathon.starter.repository.AttributeValueRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AttributeMapper {

    private final AttributeValueRepository attributeValueRepository;

    public AttributeMapper(AttributeValueRepository attributeValueRepository) {
        this.attributeValueRepository = attributeValueRepository;
    }

    public AttributeValueResponse toResponse(AttributeValue value) {
        return new AttributeValueResponse(value.getId(), value.getValue());
    }

    public AttributeTypeResponse toResponse(AttributeType type) {
        List<AttributeValueResponse> values = attributeValueRepository.findByAttributeTypeId(type.getId()).stream()
                .map(this::toResponse)
                .toList();
        return new AttributeTypeResponse(type.getId(), type.getName(), values);
    }
}
