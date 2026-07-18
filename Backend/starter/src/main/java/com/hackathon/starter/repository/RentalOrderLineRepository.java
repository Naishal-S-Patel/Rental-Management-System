package com.hackathon.starter.repository;

import com.hackathon.starter.entity.RentalOrderLine;
import com.hackathon.starter.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface RentalOrderLineRepository extends JpaRepository<RentalOrderLine, Long> {

    List<RentalOrderLine> findByOrderId(UUID orderId);

    /**
     * Reserved quantity for a variant across any order line whose [start,end) overlaps the
     * requested range and whose order is in a "holds stock" status - the availability check
     * from SYSTEM_DESIGN.md §5.1. Re-checked advisory (cart) and authoritative (confirm, inside
     * the confirming transaction).
     */
    @Query("""
            SELECT COALESCE(SUM(l.quantity), 0) FROM RentalOrderLine l
            WHERE l.productVariant.id = :variantId
              AND l.order.status IN :statuses
              AND l.startDate < :endDate AND l.endDate > :startDate
              AND (:excludeOrderId IS NULL OR l.order.id <> :excludeOrderId)
            """)
    int sumReservedQuantity(@Param("variantId") UUID variantId,
                             @Param("statuses") Collection<OrderStatus> statuses,
                             @Param("startDate") LocalDate startDate,
                             @Param("endDate") LocalDate endDate,
                             @Param("excludeOrderId") UUID excludeOrderId);

    @Query("""
            SELECT l FROM RentalOrderLine l
            WHERE l.order.status = com.hackathon.starter.enums.OrderStatus.PAID
              AND l.startDate = :date
            """)
    List<RentalOrderLine> findUpcomingPickupsOn(@Param("date") LocalDate date);

    @Query("""
            SELECT l FROM RentalOrderLine l
            WHERE l.order.status = com.hackathon.starter.enums.OrderStatus.ACTIVE
              AND l.endDate = :date
            """)
    List<RentalOrderLine> findUpcomingReturnsOn(@Param("date") LocalDate date);
}
