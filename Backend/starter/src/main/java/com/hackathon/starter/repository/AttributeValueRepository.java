package com.hackathon.starter.repository;

import com.hackathon.starter.entity.AttributeValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttributeValueRepository extends JpaRepository<AttributeValue, Long> {

    List<AttributeValue> findByAttributeTypeId(Long attributeTypeId);
}
