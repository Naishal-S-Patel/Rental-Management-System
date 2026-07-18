package com.hackathon.starter.repository;

import com.hackathon.starter.entity.PricelistItem;
import com.hackathon.starter.enums.DurationUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PricelistItemRepository extends JpaRepository<PricelistItem, Long> {

    List<PricelistItem> findByPricelistId(Long pricelistId);

    Optional<PricelistItem> findByPricelistIdAndProductVariantIdAndDurationUnit(
            Long pricelistId, UUID productVariantId, DurationUnit durationUnit);

    /**
     * Candidate price rules for a variant/duration/date, ordered oldest-pricelist-first
     * (PRD_README.md §5/Q8 - oldest createdAt wins on conflict). PricingService takes the
     * first result, falling back to the default pricelist if this list is empty.
     */
    @Query("""
            SELECT pi FROM PricelistItem pi
            JOIN pi.pricelist pl
            WHERE pi.productVariant.id = :variantId
              AND pi.durationUnit = :durationUnit
              AND pl.active = true
              AND (pl.validFrom IS NULL OR pl.validFrom <= :date)
              AND (pl.validTo IS NULL OR pl.validTo >= :date)
            ORDER BY pl.createdAt ASC
            """)
    List<PricelistItem> findCandidates(@Param("variantId") UUID variantId,
                                        @Param("durationUnit") DurationUnit durationUnit,
                                        @Param("date") LocalDate date);
}
