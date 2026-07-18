package com.hackathon.starter.entity;

import com.hackathon.starter.enums.DepositTxnType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Append-only ledger row (PDF §2 "maintain complete deposit history") - no service method ever
 * UPDATEs a row here, only INSERTs (DB_SCHEMA.md §4 key invariant).
 */
@Entity
@Table(name = "deposit_transactions", indexes = @Index(name = "idx_deposit_txn_deposit_id", columnList = "deposit_id"))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepositTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deposit_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private SecurityDeposit deposit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DepositTxnType type;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 255)
    private String reason;

    @Column(name = "razorpay_refund_id", length = 100)
    private String razorpayRefundId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
