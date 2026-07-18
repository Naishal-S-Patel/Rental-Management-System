package com.hackathon.starter.service;

import com.hackathon.starter.dto.response.PaymentInitiateResponse;
import com.hackathon.starter.entity.Payment;
import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.enums.OrderStatus;
import com.hackathon.starter.enums.PaymentStatus;
import com.hackathon.starter.enums.PaymentType;
import com.hackathon.starter.exception.PaymentVerificationException;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.PaymentRepository;
import com.hackathon.starter.repository.RentalOrderRepository;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Order-level payment via Razorpay (rental + deposit charged together, PRD_README.md §8).
 * Order only moves CONFIRMED -> PAID on a verified webhook event, never on a client-side
 * "success" callback alone (SYSTEM_DESIGN.md §6.3 - client callbacks are spoofable).
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final RentalOrderRepository rentalOrderRepository;
    private final RazorpayService razorpayService;
    private final OrderService orderService;
    private final DepositService depositService;
    private final EmailService emailService;

    public PaymentService(PaymentRepository paymentRepository, RentalOrderRepository rentalOrderRepository,
                           RazorpayService razorpayService, OrderService orderService, DepositService depositService,
                           EmailService emailService) {
        this.paymentRepository = paymentRepository;
        this.rentalOrderRepository = rentalOrderRepository;
        this.razorpayService = razorpayService;
        this.orderService = orderService;
        this.depositService = depositService;
        this.emailService = emailService;
    }

    public List<Payment> listForOrder(UUID orderId) {
        return paymentRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
    }

    @Transactional
    public PaymentInitiateResponse initiatePayment(UUID orderId, UUID customerId) {
        RentalOrder order = rentalOrderRepository.findByIdAndCustomerId(orderId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        orderService.requireStatus(order, OrderStatus.CONFIRMED);

        var created = razorpayService.createOrder(order.getTotalAmount(), order.getId().toString());
        paymentRepository.save(Payment.builder()
                .order(order).razorpayOrderId(created.razorpayOrderId()).type(PaymentType.ORDER_PAYMENT)
                .amount(created.amount()).status(PaymentStatus.CREATED).build());
        return new PaymentInitiateResponse(created.razorpayOrderId(), razorpayService.getKeyId(), created.amount(), "INR");
    }

    /**
     * Only "payment.captured" events actually move state; every other event is logged and
     * ignored. Idempotent - a webhook can legitimately be delivered more than once.
     */
    @Transactional
    public void handleWebhook(String payload, String signature) {
        if (!razorpayService.verifyWebhookSignature(payload, signature)) {
            throw new PaymentVerificationException("Invalid Razorpay webhook signature");
        }
        JSONObject json = new JSONObject(payload);
        String event = json.optString("event");
        if (!"payment.captured".equals(event)) {
            log.debug("Ignoring Razorpay webhook event: {}", event);
            return;
        }

        JSONObject paymentEntity = json.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");
        String razorpayOrderId = paymentEntity.getString("order_id");
        String razorpayPaymentId = paymentEntity.getString("id");

        Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("No payment record for Razorpay order " + razorpayOrderId));
        if (payment.getStatus() == PaymentStatus.PAID) {
            log.debug("Payment {} already marked PAID - ignoring duplicate webhook delivery", payment.getId());
            return;
        }

        payment.setRazorpayPaymentId(razorpayPaymentId);
        payment.setStatus(PaymentStatus.PAID);
        paymentRepository.save(payment);

        RentalOrder order = payment.getOrder();
        orderService.transition(order, OrderStatus.CONFIRMED, OrderStatus.PAID);
        depositService.holdDeposit(order);
        emailService.sendPaymentReceivedEmail(order);
    }
}
