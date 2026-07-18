package com.hackathon.starter.service;

import com.hackathon.starter.entity.RentalSettings;
import com.hackathon.starter.repository.RentalSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Singleton settings row (DB_SCHEMA.md §4) - always id=1. getSettings() creates a sane-default
 * row on first read if missing, so every other service can depend on this always returning a
 * value rather than each caller handling "not configured yet".
 */
@Service
public class RentalSettingsService {

    private static final Long SINGLETON_ID = 1L;

    private final RentalSettingsRepository rentalSettingsRepository;

    public RentalSettingsService(RentalSettingsRepository rentalSettingsRepository) {
        this.rentalSettingsRepository = rentalSettingsRepository;
    }

    @Transactional
    public RentalSettings getSettings() {
        return rentalSettingsRepository.findById(SINGLETON_ID)
                .orElseGet(() -> rentalSettingsRepository.save(RentalSettings.builder()
                        .id(SINGLETON_ID)
                        .dailyLateFeePercentage(new BigDecimal("0.0200"))
                        .maxLateFeeMultiplier(new BigDecimal("2.00"))
                        .gracePeriodDays(0)
                        .defaultPickupWindowDays(1)
                        .defaultReturnWindowDays(1)
                        .build()));
    }

    @Transactional
    public RentalSettings updateSettings(BigDecimal dailyLateFeePercentage, BigDecimal maxLateFeeMultiplier,
                                          int gracePeriodDays, int defaultPickupWindowDays, int defaultReturnWindowDays) {
        RentalSettings settings = getSettings();
        settings.setDailyLateFeePercentage(dailyLateFeePercentage);
        settings.setMaxLateFeeMultiplier(maxLateFeeMultiplier);
        settings.setGracePeriodDays(gracePeriodDays);
        settings.setDefaultPickupWindowDays(defaultPickupWindowDays);
        settings.setDefaultReturnWindowDays(defaultReturnWindowDays);
        return rentalSettingsRepository.save(settings);
    }
}
