package com.hackathon.starter.service;

import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.entity.RentalOrderLine;
import com.hackathon.starter.entity.RentalSettings;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Compounding daily late fee (PRD_README.md §7/Q6, SYSTEM_DESIGN.md §5.3):
 * fee = baseAmount x ((1 + dailyRate)^daysLate - 1), capped at baseAmount x maxLateFeeMultiplier
 * (its own setting, decoupled from the deposit). baseAmount aggregates every line's
 * product.basePrice x quantity across the order - a multi-product order's overdue balance is
 * the sum of what's actually still out, not any single line in isolation.
 */
@Service
public class LateFeeService {

    public record Calculation(int daysLate, BigDecimal dailyRatePercentage, BigDecimal baseAmount,
                               BigDecimal calculatedAmount, BigDecimal cappedAmount) {

        public static Calculation none(BigDecimal dailyRatePercentage, BigDecimal baseAmount) {
            return new Calculation(0, dailyRatePercentage, baseAmount, BigDecimal.ZERO, BigDecimal.ZERO);
        }
    }

    public Calculation calculate(RentalOrder order, LocalDateTime actualReturnDate, RentalSettings settings) {
        LocalDate dueDate = order.getLines().stream()
                .map(RentalOrderLine::getEndDate)
                .max(LocalDate::compareTo)
                .orElseThrow(() -> new IllegalStateException("Order has no lines"));

        BigDecimal baseAmount = order.getLines().stream()
                .map(line -> line.getProductVariant().getProduct().getBasePrice()
                        .multiply(BigDecimal.valueOf(line.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long rawLateDays = ChronoUnit.DAYS.between(dueDate, actualReturnDate.toLocalDate()) - settings.getGracePeriodDays();
        int daysLate = (int) Math.max(0, rawLateDays);

        if (daysLate == 0) {
            return Calculation.none(settings.getDailyLateFeePercentage(), baseAmount);
        }

        BigDecimal compoundFactor = BigDecimal.ONE.add(settings.getDailyLateFeePercentage()).pow(daysLate);
        BigDecimal calculatedAmount = baseAmount.multiply(compoundFactor.subtract(BigDecimal.ONE))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal cap = baseAmount.multiply(settings.getMaxLateFeeMultiplier()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal cappedAmount = calculatedAmount.min(cap);

        return new Calculation(daysLate, settings.getDailyLateFeePercentage(), baseAmount, calculatedAmount, cappedAmount);
    }
}
