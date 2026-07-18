package com.hackathon.starter.service;

import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.entity.User;

import java.math.BigDecimal;

public interface EmailService {

    void sendVerificationEmail(User user, String rawToken);

    void sendPasswordResetEmail(User user, String rawToken);

    void sendWelcomeEmail(User user);

    /** Rental notification events (PRD_README.md §12 - the Round-3 set: confirmation, payment, pickup, overdue, refund). */
    void sendOrderConfirmedEmail(RentalOrder order);

    void sendPaymentReceivedEmail(RentalOrder order);

    void sendPickupScheduledEmail(RentalOrder order);

    void sendOverdueNoticeEmail(RentalOrder order, long daysOverdue);

    void sendDepositRefundEmail(RentalOrder order, BigDecimal refundAmount, BigDecimal penaltyAmount);
}
