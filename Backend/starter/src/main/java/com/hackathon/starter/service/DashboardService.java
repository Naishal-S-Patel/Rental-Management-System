package com.hackathon.starter.service;

import com.hackathon.starter.dto.response.DashboardSummaryResponse;
import com.hackathon.starter.dto.response.OverdueOrderResponse;
import com.hackathon.starter.entity.RentalReturn;
import com.hackathon.starter.enums.OrderStatus;
import com.hackathon.starter.enums.PickupStatus;
import com.hackathon.starter.enums.ReturnStatus;
import com.hackathon.starter.repository.PenaltyRepository;
import com.hackathon.starter.repository.PickupRepository;
import com.hackathon.starter.repository.RentalOrderRepository;
import com.hackathon.starter.repository.RentalReturnRepository;
import com.hackathon.starter.repository.SecurityDepositRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/** Backs the admin operations dashboard (PDF §1) - one aggregate payload, all live-computed queries. */
@Service
public class DashboardService {

    private static final List<OrderStatus> REVENUE_STATUSES = List.of(
            OrderStatus.PAID, OrderStatus.SCHEDULED_PICKUP, OrderStatus.ACTIVE, OrderStatus.RETURNED,
            OrderStatus.SETTLED, OrderStatus.CLOSED);

    private final RentalOrderRepository rentalOrderRepository;
    private final RentalReturnRepository rentalReturnRepository;
    private final PickupRepository pickupRepository;
    private final SecurityDepositRepository securityDepositRepository;
    private final PenaltyRepository penaltyRepository;

    public DashboardService(RentalOrderRepository rentalOrderRepository, RentalReturnRepository rentalReturnRepository,
                             PickupRepository pickupRepository, SecurityDepositRepository securityDepositRepository,
                             PenaltyRepository penaltyRepository) {
        this.rentalOrderRepository = rentalOrderRepository;
        this.rentalReturnRepository = rentalReturnRepository;
        this.pickupRepository = pickupRepository;
        this.securityDepositRepository = securityDepositRepository;
        this.penaltyRepository = penaltyRepository;
    }

    public DashboardSummaryResponse summary() {
        LocalDate today = LocalDate.now();
        long activeRentals = rentalOrderRepository.countByStatus(OrderStatus.ACTIVE);
        long dueToday = rentalReturnRepository.countByStatusAndScheduledDate(ReturnStatus.SCHEDULED, today);
        long upcomingPickups = pickupRepository.countByStatusAndScheduledDateGreaterThanEqual(PickupStatus.SCHEDULED, today);
        long upcomingReturns = rentalReturnRepository.countByStatusAndScheduledDate(ReturnStatus.SCHEDULED, today);
        long overdue = rentalReturnRepository.countByStatusAndScheduledDateBefore(ReturnStatus.SCHEDULED, today);

        return new DashboardSummaryResponse(
                activeRentals, dueToday, upcomingPickups, upcomingReturns, overdue,
                rentalOrderRepository.sumRentalRevenue(REVENUE_STATUSES),
                securityDepositRepository.sumHeld(),
                penaltyRepository.sumLateFeeCollection());
    }

    public List<OverdueOrderResponse> overdueDetail() {
        LocalDate today = LocalDate.now();
        return rentalReturnRepository.findByStatusAndScheduledDateBefore(ReturnStatus.SCHEDULED, today).stream()
                .map(rentalReturn -> toOverdueResponse(rentalReturn, today))
                .toList();
    }

    private OverdueOrderResponse toOverdueResponse(RentalReturn rentalReturn, LocalDate today) {
        var order = rentalReturn.getOrder();
        long daysOverdue = ChronoUnit.DAYS.between(rentalReturn.getScheduledDate(), today);
        String customerName = (order.getCustomer().getFirstName() + " " + order.getCustomer().getLastName()).trim();
        return new OverdueOrderResponse(order.getId(), customerName, rentalReturn.getScheduledDate(), daysOverdue);
    }
}
