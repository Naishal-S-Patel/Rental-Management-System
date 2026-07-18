package com.hackathon.starter.repository;

import com.hackathon.starter.entity.DamageReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DamageReportRepository extends JpaRepository<DamageReport, Long> {

    List<DamageReport> findByRentalReturnId(Long returnId);
}
