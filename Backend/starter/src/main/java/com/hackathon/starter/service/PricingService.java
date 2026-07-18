package com.hackathon.starter.service;

import com.hackathon.starter.entity.Pricelist;
import com.hackathon.starter.entity.PricelistItem;
import com.hackathon.starter.entity.RentalPeriod;
import com.hackathon.starter.enums.DurationUnit;
import com.hackathon.starter.exception.BadRequestException;
import com.hackathon.starter.repository.PricelistItemRepository;
import com.hackathon.starter.repository.PricelistRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Resolves the applicable price for a line (SYSTEM_DESIGN.md §5.2 - oldest-created pricelist
 * wins on conflict, PRD_README.md §5/Q8), falling back to the default pricelist.
 *
 * Duration-unit gap not explicitly specified by a cart/order line itself (only start/end dates
 * + an optional RentalPeriod are stored): when a RentalPeriod is selected, its durationUnit and
 * durationValue drive the lookup and quantity of units directly (e.g. a "2 Weeks" period prices
 * at the WEEK rate x 2). For free-form dates (no RentalPeriod), this defaults to DAY-granularity
 * pricing with units = whole days between start/end (minimum 1) - the finest, most common rental
 * pricing grain and the PDF's implicit default. This is an implementation decision filling a gap
 * the PRD/DB schema left open; flag if a different default duration unit was intended.
 */
@Service
public class PricingService {

    private final PricelistItemRepository pricelistItemRepository;
    private final PricelistRepository pricelistRepository;

    public PricingService(PricelistItemRepository pricelistItemRepository, PricelistRepository pricelistRepository) {
        this.pricelistItemRepository = pricelistItemRepository;
        this.pricelistRepository = pricelistRepository;
    }

    public record LinePricing(BigDecimal unitPrice, int units, BigDecimal lineTotal) {
    }

    public LinePricing resolveLinePricing(UUID productVariantId, LocalDate startDate, LocalDate endDate,
                                           RentalPeriod rentalPeriod, int quantity) {
        DurationUnit durationUnit = rentalPeriod != null ? rentalPeriod.getDurationUnit() : DurationUnit.DAY;
        int units = rentalPeriod != null
                ? rentalPeriod.getDurationValue()
                : (int) Math.max(1, ChronoUnit.DAYS.between(startDate, endDate));

        BigDecimal unitPrice = resolveUnitPrice(productVariantId, durationUnit, startDate);
        BigDecimal lineTotal = unitPrice
                .multiply(BigDecimal.valueOf(units))
                .multiply(BigDecimal.valueOf(quantity));
        return new LinePricing(unitPrice, units, lineTotal);
    }

    public BigDecimal resolveUnitPrice(UUID productVariantId, DurationUnit durationUnit, LocalDate date) {
        List<PricelistItem> candidates = pricelistItemRepository.findCandidates(productVariantId, durationUnit, date);
        if (!candidates.isEmpty()) {
            return candidates.get(0).getUnitPrice();
        }
        Pricelist defaultPricelist = pricelistRepository.findByIsDefaultTrue()
                .orElseThrow(() -> new BadRequestException("No default pricelist is configured"));
        return pricelistItemRepository
                .findByPricelistIdAndProductVariantIdAndDurationUnit(defaultPricelist.getId(), productVariantId, durationUnit)
                .map(PricelistItem::getUnitPrice)
                .orElseThrow(() -> new BadRequestException(
                        "No price configured for this product/duration combination"));
    }
}
