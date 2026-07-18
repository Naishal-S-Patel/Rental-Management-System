package com.hackathon.starter.entity;

import com.hackathon.starter.enums.DurationUnit;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** Named duration template (e.g. "Weekend", "1 Week") - PRD_README.md §4/Q5: one of two ways to land on a start/end date range, alongside free-form dates. */
@Entity
@Table(name = "rental_periods")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "duration_value", nullable = false)
    private int durationValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "duration_unit", nullable = false, length = 10)
    private DurationUnit durationUnit;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
