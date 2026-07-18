package com.hackathon.starter.service;

import com.hackathon.starter.entity.DamageReport;
import com.hackathon.starter.entity.DamageReportPhoto;
import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.entity.RentalReturn;
import com.hackathon.starter.entity.User;
import com.hackathon.starter.enums.OrderStatus;
import com.hackathon.starter.enums.RepairStatus;
import com.hackathon.starter.enums.ReturnStatus;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.DamageReportPhotoRepository;
import com.hackathon.starter.repository.DamageReportRepository;
import com.hackathon.starter.repository.RentalReturnRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Return confirmation, damage reporting, and settlement triggering (PDF §4). */
@Service
public class RentalReturnService {

    private final RentalReturnRepository rentalReturnRepository;
    private final DamageReportRepository damageReportRepository;
    private final DamageReportPhotoRepository damageReportPhotoRepository;
    private final OrderService orderService;
    private final DepositSettlementService depositSettlementService;
    private final FileStorageService fileStorageService;

    public RentalReturnService(RentalReturnRepository rentalReturnRepository, DamageReportRepository damageReportRepository,
                                DamageReportPhotoRepository damageReportPhotoRepository, OrderService orderService,
                                DepositSettlementService depositSettlementService, FileStorageService fileStorageService) {
        this.rentalReturnRepository = rentalReturnRepository;
        this.damageReportRepository = damageReportRepository;
        this.damageReportPhotoRepository = damageReportPhotoRepository;
        this.orderService = orderService;
        this.depositSettlementService = depositSettlementService;
        this.fileStorageService = fileStorageService;
    }

    public List<RentalReturn> listByDate(LocalDate date) {
        return rentalReturnRepository.findByScheduledDate(date);
    }

    public RentalReturn getForOrder(UUID orderId) {
        return rentalReturnRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Return not found for this order"));
    }

    @Transactional
    public RentalReturn confirmReturn(RentalOrder order, User admin, String conditionNotes, boolean damageReported, boolean missingAccessories) {
        RentalReturn rentalReturn = getForOrder(order.getId());
        rentalReturn.setActualReturnDate(LocalDateTime.now());
        rentalReturn.setStatus(ReturnStatus.RETURNED);
        rentalReturn.setConditionNotes(conditionNotes);
        rentalReturn.setDamageReported(damageReported);
        rentalReturn.setMissingAccessories(missingAccessories);
        rentalReturn.setInspectedBy(admin);
        rentalReturnRepository.save(rentalReturn);

        orderService.transition(order, OrderStatus.ACTIVE, OrderStatus.RETURNED);
        return rentalReturn;
    }

    /** Triggers DepositSettlementService's single-transaction settlement (SYSTEM_DESIGN.md §4). */
    @Transactional
    public RentalOrder settle(RentalOrder order) {
        RentalReturn rentalReturn = getForOrder(order.getId());
        RentalOrder settled = depositSettlementService.settle(order, rentalReturn);
        rentalReturn.setStatus(ReturnStatus.SETTLED);
        rentalReturnRepository.save(rentalReturn);
        return settled;
    }

    @Transactional
    public DamageReport addDamageReport(RentalOrder order, String description, BigDecimal estimatedCost, List<MultipartFile> photos) {
        RentalReturn rentalReturn = getForOrder(order.getId());
        rentalReturn.setDamageReported(true);
        rentalReturnRepository.save(rentalReturn);

        DamageReport damageReport = damageReportRepository.save(DamageReport.builder()
                .rentalReturn(rentalReturn).description(description).estimatedCost(estimatedCost)
                .repairStatus(RepairStatus.REPORTED).build());

        if (photos != null) {
            for (MultipartFile photo : photos) {
                var stored = fileStorageService.store(order.getCustomer().getId(), photo);
                damageReportPhotoRepository.save(DamageReportPhoto.builder()
                        .damageReport(damageReport).fileId(stored.getId()).build());
            }
        }
        return damageReport;
    }

    public List<DamageReportPhoto> listPhotos(Long damageReportId) {
        return damageReportPhotoRepository.findByDamageReportId(damageReportId);
    }
}
