package com.hackathon.starter.repository;

import com.hackathon.starter.entity.SecurityDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface SecurityDepositRepository extends JpaRepository<SecurityDeposit, Long> {

    Optional<SecurityDeposit> findByOrderId(UUID orderId);

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM SecurityDeposit d WHERE d.status = com.hackathon.starter.enums.DepositStatus.HELD")
    BigDecimal sumHeld();
}
