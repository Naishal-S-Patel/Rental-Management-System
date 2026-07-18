package com.hackathon.starter.repository;

import com.hackathon.starter.entity.Penalty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface PenaltyRepository extends JpaRepository<Penalty, Long> {

    Optional<Penalty> findByOrderId(UUID orderId);

    @Query("SELECT COALESCE(SUM(p.deductedFromDeposit + p.outstandingAmount), 0) FROM Penalty p")
    BigDecimal sumLateFeeCollection();
}
