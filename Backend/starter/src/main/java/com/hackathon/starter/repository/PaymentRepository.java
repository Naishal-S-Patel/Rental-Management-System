package com.hackathon.starter.repository;

import com.hackathon.starter.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByOrderIdOrderByCreatedAtDesc(UUID orderId);

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
}
