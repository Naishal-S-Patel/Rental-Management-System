package com.hackathon.starter.repository;

import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface RentalOrderRepository extends JpaRepository<RentalOrder, UUID> {

    Page<RentalOrder> findByCustomerId(UUID customerId, Pageable pageable);

    Page<RentalOrder> findByStatus(OrderStatus status, Pageable pageable);

    Optional<RentalOrder> findByIdAndCustomerId(UUID id, UUID customerId);

    Optional<RentalOrder> findByQuotationId(UUID quotationId);

    long countByStatus(OrderStatus status);

    long countByStatusIn(Collection<OrderStatus> statuses);

    @Query("SELECT COALESCE(SUM(o.totalAmount - o.depositAmount), 0) FROM RentalOrder o WHERE o.status IN :statuses")
    BigDecimal sumRentalRevenue(@Param("statuses") Collection<OrderStatus> statuses);
}
