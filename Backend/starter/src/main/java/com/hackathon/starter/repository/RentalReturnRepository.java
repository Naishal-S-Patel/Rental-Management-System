package com.hackathon.starter.repository;

import com.hackathon.starter.entity.RentalReturn;
import com.hackathon.starter.enums.ReturnStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RentalReturnRepository extends JpaRepository<RentalReturn, Long> {

    Optional<RentalReturn> findByOrderId(UUID orderId);

    List<RentalReturn> findByScheduledDate(LocalDate scheduledDate);

    long countByStatusAndScheduledDate(ReturnStatus status, LocalDate scheduledDate);

    long countByStatusAndScheduledDateBefore(ReturnStatus status, LocalDate date);

    List<RentalReturn> findByStatusAndScheduledDateBefore(ReturnStatus status, LocalDate date);
}
