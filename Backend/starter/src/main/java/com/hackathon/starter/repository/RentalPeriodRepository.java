package com.hackathon.starter.repository;

import com.hackathon.starter.entity.RentalPeriod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RentalPeriodRepository extends JpaRepository<RentalPeriod, Long> {

    List<RentalPeriod> findByActiveTrue();
}
