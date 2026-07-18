package com.hackathon.starter.repository;

import com.hackathon.starter.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {

    List<ProductVariant> findByProductIdAndActiveTrue(UUID productId);

    List<ProductVariant> findByProductId(UUID productId);
}
