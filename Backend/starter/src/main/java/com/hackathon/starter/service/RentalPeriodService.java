package com.hackathon.starter.service;

import com.hackathon.starter.entity.RentalPeriod;
import com.hackathon.starter.enums.DurationUnit;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.RentalPeriodRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RentalPeriodService {

    private final RentalPeriodRepository rentalPeriodRepository;

    public RentalPeriodService(RentalPeriodRepository rentalPeriodRepository) {
        this.rentalPeriodRepository = rentalPeriodRepository;
    }

    public List<RentalPeriod> listActive() {
        return rentalPeriodRepository.findByActiveTrue();
    }

    public RentalPeriod getById(Long id) {
        return rentalPeriodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rental period not found"));
    }

    @Transactional
    public RentalPeriod create(String name, int durationValue, DurationUnit durationUnit) {
        return rentalPeriodRepository.save(RentalPeriod.builder()
                .name(name).durationValue(durationValue).durationUnit(durationUnit).build());
    }

    @Transactional
    public RentalPeriod update(Long id, String name, int durationValue, DurationUnit durationUnit) {
        RentalPeriod period = getById(id);
        period.setName(name);
        period.setDurationValue(durationValue);
        period.setDurationUnit(durationUnit);
        return rentalPeriodRepository.save(period);
    }

    @Transactional
    public void delete(Long id) {
        RentalPeriod period = getById(id);
        period.setActive(false);
        rentalPeriodRepository.save(period);
    }
}
