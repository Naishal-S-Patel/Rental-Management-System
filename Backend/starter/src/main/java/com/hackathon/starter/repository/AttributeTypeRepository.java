package com.hackathon.starter.repository;

import com.hackathon.starter.entity.AttributeType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttributeTypeRepository extends JpaRepository<AttributeType, Long> {

    boolean existsByNameIgnoreCase(String name);
}
