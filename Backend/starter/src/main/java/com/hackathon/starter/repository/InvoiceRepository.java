package com.hackathon.starter.repository;

import com.hackathon.starter.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    List<Invoice> findByOrderIdOrderByIssuedAtDesc(UUID orderId);
}
