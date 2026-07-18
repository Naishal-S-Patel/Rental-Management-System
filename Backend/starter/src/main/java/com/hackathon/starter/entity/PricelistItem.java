package com.hackathon.starter.entity;

import com.hackathon.starter.enums.DurationUnit;
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
import jakarta.persistence.UniqueConstraint;
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

@Entity
@Table(name = "pricelist_items",
        indexes = {
                @Index(name = "idx_pricelist_items_pricelist_id", columnList = "pricelist_id"),
                @Index(name = "idx_pricelist_items_variant_id", columnList = "product_variant_id")
        },
        uniqueConstraints = @UniqueConstraint(name = "uk_pricelist_items_variant_duration",
                columnNames = {"pricelist_id", "product_variant_id", "duration_unit"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricelistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pricelist_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Pricelist pricelist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private ProductVariant productVariant;

    @Enumerated(EnumType.STRING)
    @Column(name = "duration_unit", nullable = false, length = 10)
    private DurationUnit durationUnit;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
