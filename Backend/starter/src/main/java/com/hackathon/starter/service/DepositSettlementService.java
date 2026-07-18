package com.hackathon.starter.service;

import com.hackathon.starter.entity.Payment;
import com.hackathon.starter.entity.Penalty;
import com.hackathon.starter.entity.RentalOrder;
import com.hackathon.starter.entity.RentalReturn;
import com.hackathon.starter.entity.RentalSettings;
import com.hackathon.starter.entity.SecurityDeposit;
import com.hackathon.starter.enums.DepositStatus;
import com.hackathon.starter.enums.DepositTxnType;
import com.hackathon.starter.enums.OrderStatus;
import com.hackathon.starter.enums.PaymentStatus;
import com.hackathon.starter.enums.PaymentType;
import com.hackathon.starter.repository.PaymentRepository;
import com.hackathon.starter.repository.PenaltyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * The single @Transactional boundary that closes an order out (SYSTEM_DESIGN.md §4): late-day
 * calculation -> deposit deduction (capped at the deposit's own amount) -> Razorpay refund of
 * whatever remains -> late-fee invoice if any penalty applied -> RETURNED -> SETTLED -> CLOSED.
 * No caller does any of these steps individually - that's what "never half-settled" means.
 */
@Service
public class DepositSettlementService {

    private final OrderService orderService;
    private final DepositService depositService;
    private final LateFeeService lateFeeService;
    private final RazorpayService razorpayService;
    private final InvoiceService invoiceService;
    private final RentalSettingsService rentalSettingsService;
    private final PenaltyRepository penaltyRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;

    public DepositSettlementService(OrderService orderService, DepositService depositService, LateFeeService lateFeeService,
                                     RazorpayService razorpayService, InvoiceService invoiceService,
                                     RentalSettingsService rentalSettingsService, PenaltyRepository penaltyRepository,
                                     PaymentRepository paymentRepository, EmailService emailService) {
        this.orderService = orderService;
        this.depositService = depositService;
        this.lateFeeService = lateFeeService;
        this.razorpayService = razorpayService;
        this.invoiceService = invoiceService;
        this.rentalSettingsService = rentalSettingsService;
        this.penaltyRepository = penaltyRepository;
        this.paymentRepository = paymentRepository;
        this.emailService = emailService;
    }

    @Transactional
    public RentalOrder settle(RentalOrder order, RentalReturn rentalReturn) {
        orderService.requireStatus(order, OrderStatus.RETURNED);

        SecurityDeposit deposit = depositService.getForOrder(order.getId());
        RentalSettings settings = rentalSettingsService.getSettings();
        LateFeeService.Calculation calc = lateFeeService.calculate(order, rentalReturn.getActualReturnDate(), settings);

        BigDecimal deductedFromDeposit = BigDecimal.ZERO;
        BigDecimal outstanding = BigDecimal.ZERO;

        if (calc.daysLate() > 0) {
            deductedFromDeposit = calc.cappedAmount().min(deposit.getAmount());
            outstanding = calc.cappedAmount().subtract(deductedFromDeposit).max(BigDecimal.ZERO);

            penaltyRepository.save(Penalty.builder()
                    .order(order).daysLate(calc.daysLate()).dailyRatePercentage(calc.dailyRatePercentage())
                    .baseAmount(calc.baseAmount()).calculatedAmount(calc.calculatedAmount()).cappedAmount(calc.cappedAmount())
                    .deductedFromDeposit(deductedFromDeposit).outstandingAmount(outstanding)
                    .build());

            depositService.recordTransaction(deposit, DepositTxnType.DEDUCTION, deductedFromDeposit,
                    "Late return penalty (%d day(s) late)".formatted(calc.daysLate()), null);

            invoiceService.generateLateFeeInvoice(order, calc.cappedAmount());
        }

        BigDecimal refundToCustomer = deposit.getAmount().subtract(deductedFromDeposit);
        if (refundToCustomer.compareTo(BigDecimal.ZERO) > 0) {
            Payment originalPayment = paymentRepository.findByOrderIdOrderByCreatedAtDesc(order.getId()).stream()
                    .filter(p -> p.getType() == PaymentType.ORDER_PAYMENT && p.getStatus() == PaymentStatus.PAID)
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("No captured payment found for order " + order.getId()));

            String razorpayRefundId = razorpayService.refund(originalPayment.getRazorpayPaymentId(), refundToCustomer);

            String reason = calc.daysLate() == 0 ? "On-time return - full deposit refunded" : "Remainder refunded after penalty deduction";
            depositService.recordTransaction(deposit, DepositTxnType.REFUND, refundToCustomer, reason, razorpayRefundId);

            paymentRepository.save(Payment.builder()
                    .order(order).razorpayOrderId(originalPayment.getRazorpayOrderId()).razorpayPaymentId(razorpayRefundId)
                    .type(PaymentType.REFUND).amount(refundToCustomer).status(PaymentStatus.REFUNDED)
                    .build());
        }

        depositService.updateStatus(deposit, resolveFinalStatus(deductedFromDeposit, deposit.getAmount()));

        emailService.sendDepositRefundEmail(order, refundToCustomer, calc.daysLate() > 0 ? calc.cappedAmount() : BigDecimal.ZERO);

        orderService.transition(order, OrderStatus.RETURNED, OrderStatus.SETTLED);
        return orderService.transition(order, OrderStatus.SETTLED, OrderStatus.CLOSED);
    }

    private DepositStatus resolveFinalStatus(BigDecimal deducted, BigDecimal depositAmount) {
        if (deducted.compareTo(BigDecimal.ZERO) == 0) {
            return DepositStatus.REFUNDED;
        }
        if (deducted.compareTo(depositAmount) >= 0) {
            return DepositStatus.FORFEITED;
        }
        return DepositStatus.PARTIALLY_REFUNDED;
    }
}
