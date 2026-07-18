package com.hackathon.starter.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * calculated_amount uses the compounding formula (PRD_README.md §7/Q6):
 * base_amount x ((1 + daily_rate_percentage) ^ days_late - 1). capped_amount applies
 * rental_settings.max_late_fee_multiplier (its own setting, decoupled from the deposit).
 * outstanding_amount (capped_amount - deducted_from_deposit, when positive) mirrors into a
 * LATE_FEE invoice so it stays visible per PDF §3 "clear visibility of outstanding penalties".
 */
@Entity
@Table(name = "penalties")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Penalty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private RentalOrder order;

    @Column(name = "days_late", nullable = false)
    private int daysLate;

    @Column(name = "daily_rate_percentage", nullable = false, precision = 5, scale = 4)
    private BigDecimal dailyRatePercentage;

    @Column(name = "base_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseAmount;

    @Column(name = "calculated_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal calculatedAmount;

    @Column(name = "capped_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal cappedAmount;

    @Column(name = "deducted_from_deposit", nullable = false, precision = 12, scale = 2)
    private BigDecimal deductedFromDeposit;

    @Column(name = "outstanding_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal outstandingAmount = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
