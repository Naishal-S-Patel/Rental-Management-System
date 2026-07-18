package com.hackathon.starter.mapper;

import com.hackathon.starter.dto.response.DamageReportResponse;
import com.hackathon.starter.dto.response.PickupResponse;
import com.hackathon.starter.dto.response.ReturnResponse;
import com.hackathon.starter.entity.DamageReport;
import com.hackathon.starter.entity.Pickup;
import com.hackathon.starter.entity.RentalReturn;
import com.hackathon.starter.repository.DamageReportPhotoRepository;
import org.springframework.stereotype.Component;

@Component
public class PickupReturnMapper {

    private final DamageReportPhotoRepository damageReportPhotoRepository;

    public PickupReturnMapper(DamageReportPhotoRepository damageReportPhotoRepository) {
        this.damageReportPhotoRepository = damageReportPhotoRepository;
    }

    public PickupResponse toResponse(Pickup pickup) {
        return new PickupResponse(pickup.getId(), pickup.getOrder().getId(), pickup.getScheduledDate(),
                pickup.getStatus(), pickup.getChecklistNotes(), pickup.getConfirmedAt());
    }

    public ReturnResponse toResponse(RentalReturn rentalReturn) {
        return new ReturnResponse(rentalReturn.getId(), rentalReturn.getOrder().getId(), rentalReturn.getScheduledDate(),
                rentalReturn.getActualReturnDate(), rentalReturn.getStatus(), rentalReturn.getConditionNotes(),
                rentalReturn.isDamageReported(), rentalReturn.isMissingAccessories());
    }

    public DamageReportResponse toResponse(DamageReport damageReport) {
        var photoFileIds = damageReportPhotoRepository.findByDamageReportId(damageReport.getId()).stream()
                .map(photo -> photo.getFileId())
                .toList();
        return new DamageReportResponse(damageReport.getId(), damageReport.getDescription(),
                damageReport.getEstimatedCost(), damageReport.getRepairStatus(), photoFileIds);
    }
}
