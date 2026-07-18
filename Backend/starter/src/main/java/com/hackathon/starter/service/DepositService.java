package com.hackathon.starter.service;

import com.hackathon.starter.entity.DepositTransaction;
import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.entity.SecurityDeposit;
import com.hackathon.starter.enums.DepositStatus;
import com.hackathon.starter.enums.DepositTxnType;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.DepositTransactionRepository;
import com.hackathon.starter.repository.SecurityDepositRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Deposit ledger CRUD - the append-only invariant lives here (PDF §2 "maintain complete deposit
 * history"): recordTransaction only ever INSERTs, and SecurityDeposit.status is a derived cache
 * updated alongside, never the source of truth (DB_SCHEMA.md §2.7).
 */
@Service
public class DepositService {

    private final SecurityDepositRepository securityDepositRepository;
    private final DepositTransactionRepository depositTransactionRepository;

    public DepositService(SecurityDepositRepository securityDepositRepository, DepositTransactionRepository depositTransactionRepository) {
        this.securityDepositRepository = securityDepositRepository;
        this.depositTransactionRepository = depositTransactionRepository;
    }

    public SecurityDeposit getForOrder(UUID orderId) {
        return securityDepositRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Deposit not found for this order"));
    }

    public List<DepositTransaction> listTransactions(Long depositId) {
        return depositTransactionRepository.findByDepositIdOrderByCreatedAtDesc(depositId);
    }

    @Transactional
    public SecurityDeposit holdDeposit(RentalOrder order) {
        SecurityDeposit deposit = securityDepositRepository.save(SecurityDeposit.builder()
                .order(order).amount(order.getDepositAmount()).status(DepositStatus.HELD).build());
        recordTransaction(deposit, DepositTxnType.HOLD, order.getDepositAmount(), "Deposit held at payment", null);
        return deposit;
    }

    @Transactional
    public DepositTransaction recordTransaction(SecurityDeposit deposit, DepositTxnType type, BigDecimal amount,
                                                  String reason, String razorpayRefundId) {
        return depositTransactionRepository.save(DepositTransaction.builder()
                .deposit(deposit).type(type).amount(amount).reason(reason).razorpayRefundId(razorpayRefundId).build());
    }

    @Transactional
    public void updateStatus(SecurityDeposit deposit, DepositStatus status) {
        deposit.setStatus(status);
        securityDepositRepository.save(deposit);
    }
}
