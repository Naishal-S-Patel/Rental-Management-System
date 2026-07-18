package com.hackathon.starter.repository;

import com.hackathon.starter.entity.QuotationLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuotationLineRepository extends JpaRepository<QuotationLine, Long> {

    List<QuotationLine> findByQuotationId(UUID quotationId);
}
