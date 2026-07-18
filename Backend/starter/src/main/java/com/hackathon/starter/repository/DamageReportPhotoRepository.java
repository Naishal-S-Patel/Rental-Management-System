package com.hackathon.starter.repository;

import com.hackathon.starter.entity.DamageReportPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DamageReportPhotoRepository extends JpaRepository<DamageReportPhoto, Long> {

    List<DamageReportPhoto> findByDamageReportId(Long damageReportId);
}
