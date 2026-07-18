package com.hackathon.starter.repository;

import com.hackathon.starter.entity.Quotation;
import com.hackathon.starter.enums.QuotationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface QuotationRepository extends JpaRepository<Quotation, UUID> {

    Page<Quotation> findByStatus(QuotationStatus status, Pageable pageable);
}
