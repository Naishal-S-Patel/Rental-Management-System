package com.hackathon.starter.mapper;

import com.hackathon.starter.dto.response.PaymentResponse;
import com.hackathon.starter.entity.Payment;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(payment.getId(), payment.getOrder().getId(), payment.getRazorpayOrderId(),
                payment.getRazorpayPaymentId(), payment.getType(), payment.getAmount(), payment.getStatus(), payment.getCreatedAt());
    }
}
