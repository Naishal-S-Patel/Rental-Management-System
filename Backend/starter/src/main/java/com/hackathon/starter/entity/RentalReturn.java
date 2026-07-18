package com.hackathon.starter.entity;

import com.hackathon.starter.enums.ReturnStatus;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity named RentalReturn (table `returns`) rather than `Return`, since `return` is a Java
 * keyword and would make the entity unusable as a local variable name in service code.
 * actual_return_date vs scheduled_date is what drives late-fee calculation (SYSTEM_DESIGN.md §5.3).
 */
@Entity
@Table(name = "returns", indexes = @Index(name = "idx_returns_scheduled_date", columnList = "scheduled_date"))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalReturn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private RentalOrder order;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "actual_return_date")
    private LocalDateTime actualReturnDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReturnStatus status;

    @Column(name = "condition_notes", columnDefinition = "TEXT")
    private String conditionNotes;

    @Column(name = "damage_reported", nullable = false)
    @Builder.Default
    private boolean damageReported = false;

    @Column(name = "missing_accessories", nullable = false)
    @Builder.Default
    private boolean missingAccessories = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspected_by")
    private User inspectedBy;

    @OneToMany(mappedBy = "rentalReturn", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DamageReport> damageReports = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
