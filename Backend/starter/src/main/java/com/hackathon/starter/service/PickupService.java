package com.hackathon.starter.service;

import com.hackathon.starter.entity.Pickup;
import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.entity.RentalOrderLine;
import com.hackathon.starter.entity.RentalReturn;
import com.hackathon.starter.entity.User;
import com.hackathon.starter.enums.OrderStatus;
import com.hackathon.starter.enums.PickupStatus;
import com.hackathon.starter.enums.ReturnStatus;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.PickupRepository;
import com.hackathon.starter.repository.RentalReturnRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Pickup schedule/confirm (PDF §4). Confirming pickup also creates the order's RentalReturn row
 * (scheduled_date = the order's latest line end_date) - the rental period truly begins here, so
 * this is when a definite due-date is locked in for late-fee tracking (DB_SCHEMA.md §2.9).
 */
@Service
public class PickupService {

    private final PickupRepository pickupRepository;
    private final RentalReturnRepository rentalReturnRepository;
    private final OrderService orderService;
    private final EmailService emailService;

    public PickupService(PickupRepository pickupRepository, RentalReturnRepository rentalReturnRepository,
                          OrderService orderService, EmailService emailService) {
        this.pickupRepository = pickupRepository;
        this.rentalReturnRepository = rentalReturnRepository;
        this.orderService = orderService;
        this.emailService = emailService;
    }

    public List<Pickup> listByDate(LocalDate date) {
        return pickupRepository.findByScheduledDate(date);
    }

    public Pickup getForOrder(UUID orderId) {
        return pickupRepository.findByOrderId(orderId).orElseThrow(() -> new ResourceNotFoundException("Pickup not found for this order"));
    }

    @Transactional
    public Pickup schedule(RentalOrder order, LocalDate scheduledDate) {
        orderService.transition(order, OrderStatus.PAID, OrderStatus.SCHEDULED_PICKUP);
        Pickup pickup = pickupRepository.save(Pickup.builder()
                .order(order).scheduledDate(scheduledDate).status(PickupStatus.SCHEDULED).build());
        emailService.sendPickupScheduledEmail(order);
        return pickup;
    }

    @Transactional
    public Pickup confirm(RentalOrder order, User admin, String checklistNotes) {
        Pickup pickup = getForOrder(order.getId());
        pickup.setStatus(PickupStatus.CONFIRMED);
        pickup.setChecklistNotes(checklistNotes);
        pickup.setConfirmedBy(admin);
        pickup.setConfirmedAt(LocalDateTime.now());
        pickupRepository.save(pickup);

        orderService.transition(order, OrderStatus.SCHEDULED_PICKUP, OrderStatus.ACTIVE);

        LocalDate dueDate = order.getLines().stream().map(RentalOrderLine::getEndDate).max(LocalDate::compareTo)
                .orElseThrow(() -> new IllegalStateException("Order has no lines"));
        rentalReturnRepository.save(RentalReturn.builder()
                .order(order).scheduledDate(dueDate).status(ReturnStatus.SCHEDULED).build());

        return pickup;
    }
}
