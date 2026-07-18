package com.hackathon.starter.service;

import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.entity.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;

/**
 * All methods are @Async on a dedicated executor (see AsyncConfig) - failures are caught and
 * logged here, never propagated, so a broken SMTP connection can't roll back or block the
 * signup/verify/forgot-password request that triggered it.
 */
@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final String emailFrom;
    private final String frontendUrl;

    public EmailServiceImpl(JavaMailSender mailSender,
                             TemplateEngine templateEngine,
                             @Value("${app.email.from}") String emailFrom,
                             @Value("${app.frontend.url}") String frontendUrl) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.emailFrom = emailFrom;
        this.frontendUrl = frontendUrl;
    }

    @Override
    @Async("emailTaskExecutor")
    public void sendVerificationEmail(User user, String rawToken) {
        Context context = new Context();
        context.setVariable("firstName", user.getFirstName());
        context.setVariable("verificationLink", frontendUrl + "/verify-email?token=" + rawToken);
        send(user.getEmail(), "Verify your email", "email/verification-email", context);
    }

    @Override
    @Async("emailTaskExecutor")
    public void sendPasswordResetEmail(User user, String rawToken) {
        Context context = new Context();
        context.setVariable("firstName", user.getFirstName());
        context.setVariable("resetLink", frontendUrl + "/reset-password?token=" + rawToken);
        context.setVariable("expiryMinutes", 30);
        send(user.getEmail(), "Reset your password", "email/password-reset-email", context);
    }

    @Override
    @Async("emailTaskExecutor")
    public void sendWelcomeEmail(User user) {
        Context context = new Context();
        context.setVariable("firstName", user.getFirstName());
        send(user.getEmail(), "Welcome!", "email/welcome-email", context);
    }

    @Override
    @Async("emailTaskExecutor")
    public void sendOrderConfirmedEmail(RentalOrder order) {
        Context context = orderContext(order);
        send(order.getCustomer().getEmail(), "Your rental order is confirmed", "email/order-confirmed-email", context);
    }

    @Override
    @Async("emailTaskExecutor")
    public void sendPaymentReceivedEmail(RentalOrder order) {
        Context context = orderContext(order);
        send(order.getCustomer().getEmail(), "Payment received", "email/payment-received-email", context);
    }

    @Override
    @Async("emailTaskExecutor")
    public void sendPickupScheduledEmail(RentalOrder order) {
        Context context = orderContext(order);
        send(order.getCustomer().getEmail(), "Your pickup is scheduled", "email/pickup-scheduled-email", context);
    }

    @Override
    @Async("emailTaskExecutor")
    public void sendOverdueNoticeEmail(RentalOrder order, long daysOverdue) {
        Context context = orderContext(order);
        context.setVariable("daysOverdue", daysOverdue);
        send(order.getCustomer().getEmail(), "Your rental is overdue", "email/overdue-notice-email", context);
    }

    @Override
    @Async("emailTaskExecutor")
    public void sendDepositRefundEmail(RentalOrder order, BigDecimal refundAmount, BigDecimal penaltyAmount) {
        Context context = orderContext(order);
        context.setVariable("refundAmount", refundAmount);
        context.setVariable("penaltyAmount", penaltyAmount);
        send(order.getCustomer().getEmail(), "Your security deposit has been settled", "email/deposit-refund-email", context);
    }

    private Context orderContext(RentalOrder order) {
        Context context = new Context();
        context.setVariable("firstName", order.getCustomer().getFirstName());
        context.setVariable("orderId", order.getId().toString());
        context.setVariable("totalAmount", order.getTotalAmount());
        context.setVariable("depositAmount", order.getDepositAmount());
        return context;
    }

    private void send(String to, String subject, String template, Context context) {
        try {
            String html = templateEngine.process(template, context);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(emailFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException | RuntimeException e) {
            log.error("Failed to send email to {} using template {}", to, template, e);
        }
    }
}
