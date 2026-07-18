package com.hackathon.starter.repository;

import com.hackathon.starter.entity.RentalSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RentalSettingsRepository extends JpaRepository<RentalSettings, Long> {
}
