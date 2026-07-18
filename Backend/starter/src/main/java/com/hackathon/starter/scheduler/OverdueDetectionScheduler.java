package com.hackathon.starter.scheduler;

import com.hackathon.starter.entity.RentalReturn;
import com.hackathon.starter.enums.ReturnStatus;
import com.hackathon.starter.repository.RentalReturnRepository;
import com.hackathon.starter.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Hourly - finds ACTIVE orders past due (RentalReturn still SCHEDULED with a scheduledDate
 * before today) and sends an overdue-notice email. Deliberately does NOT settle the deposit
 * itself - settlement only ever happens on actual return confirmation (SYSTEM_DESIGN.md §8),
 * so this job is read-only aside from the notification it sends.
 */
@Component
public class OverdueDetectionScheduler {

    private static final Logger log = LoggerFactory.getLogger(OverdueDetectionScheduler.class);

    private final RentalReturnRepository rentalReturnRepository;
    private final EmailService emailService;

    public OverdueDetectionScheduler(RentalReturnRepository rentalReturnRepository, EmailService emailService) {
        this.rentalReturnRepository = rentalReturnRepository;
        this.emailService = emailService;
    }

    @Scheduled(cron = "0 0 * * * *")
    public void detectOverdueRentals() {
        LocalDate today = LocalDate.now();
        var overdue = rentalReturnRepository.findByStatusAndScheduledDateBefore(ReturnStatus.SCHEDULED, today);
        log.debug("Overdue detection: {} rental(s) past due", overdue.size());
        for (RentalReturn rentalReturn : overdue) {
            long daysOverdue = ChronoUnit.DAYS.between(rentalReturn.getScheduledDate(), today);
            emailService.sendOverdueNoticeEmail(rentalReturn.getOrder(), daysOverdue);
        }
    }
}
