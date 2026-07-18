package com.hackathon.starter.service;

import com.hackathon.starter.entity.AttributeType;
import com.hackathon.starter.entity.AttributeValue;
import com.hackathon.starter.exception.BadRequestException;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.AttributeTypeRepository;
import com.hackathon.starter.repository.AttributeValueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AttributeService {

    private final AttributeTypeRepository attributeTypeRepository;
    private final AttributeValueRepository attributeValueRepository;

    public AttributeService(AttributeTypeRepository attributeTypeRepository, AttributeValueRepository attributeValueRepository) {
        this.attributeTypeRepository = attributeTypeRepository;
        this.attributeValueRepository = attributeValueRepository;
    }

    public List<AttributeType> listTypes() {
        return attributeTypeRepository.findAll();
    }

    public List<AttributeValue> listValues(Long attributeTypeId) {
        return attributeValueRepository.findByAttributeTypeId(attributeTypeId);
    }

    @Transactional
    public AttributeType createType(String name) {
        if (attributeTypeRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("An attribute type named '%s' already exists".formatted(name));
        }
        return attributeTypeRepository.save(AttributeType.builder().name(name).build());
    }

    @Transactional
    public AttributeValue addValue(Long attributeTypeId, String value) {
        AttributeType type = attributeTypeRepository.findById(attributeTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Attribute type not found"));
        return attributeValueRepository.save(AttributeValue.builder().attributeType(type).value(value).build());
    }
}
