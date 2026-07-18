package com.hackathon.starter.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Singleton table - application enforces exactly one row, always id = 1 (DB_SCHEMA.md §4).
 * No @GeneratedValue: RentalSettingsService is responsible for ensuring the id=1 row exists
 * (created on first read if missing) and only ever updates it, never inserts a second row.
 */
@Entity
@Table(name = "rental_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalSettings {

    @Id
    private Long id;

    @Column(name = "daily_late_fee_percentage", nullable = false, precision = 5, scale = 4)
    private BigDecimal dailyLateFeePercentage;

    @Column(name = "max_late_fee_multiplier", nullable = false, precision = 5, scale = 2)
    private BigDecimal maxLateFeeMultiplier;

    @Column(name = "grace_period_days", nullable = false)
    @Builder.Default
    private int gracePeriodDays = 0;

    @Column(name = "default_pickup_window_days", nullable = false)
    private int defaultPickupWindowDays;

    @Column(name = "default_return_window_days", nullable = false)
    private int defaultReturnWindowDays;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
