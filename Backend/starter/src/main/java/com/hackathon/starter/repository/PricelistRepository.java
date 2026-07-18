package com.hackathon.starter.repository;

import com.hackathon.starter.entity.Pricelist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PricelistRepository extends JpaRepository<Pricelist, Long> {

    Optional<Pricelist> findByIsDefaultTrue();
}
