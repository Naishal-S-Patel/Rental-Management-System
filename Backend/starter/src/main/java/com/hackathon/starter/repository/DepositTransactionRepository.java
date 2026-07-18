package com.hackathon.starter.repository;

import com.hackathon.starter.entity.DepositTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DepositTransactionRepository extends JpaRepository<DepositTransaction, Long> {

    List<DepositTransaction> findByDepositIdOrderByCreatedAtDesc(Long depositId);
}
