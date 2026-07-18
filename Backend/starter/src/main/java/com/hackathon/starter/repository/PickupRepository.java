package com.hackathon.starter.repository;

import com.hackathon.starter.entity.Pickup;
import com.hackathon.starter.enums.PickupStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PickupRepository extends JpaRepository<Pickup, Long> {

    Optional<Pickup> findByOrderId(UUID orderId);

    List<Pickup> findByScheduledDate(LocalDate scheduledDate);

    long countByStatusAndScheduledDateGreaterThanEqual(PickupStatus status, LocalDate date);
}
