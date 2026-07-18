package com.hackathon.starter.repository;

import com.hackathon.starter.entity.QuotationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuotationTemplateRepository extends JpaRepository<QuotationTemplate, Long> {
}
