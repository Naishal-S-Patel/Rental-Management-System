package com.hackathon.starter.service;

import com.hackathon.starter.exception.PaymentVerificationException;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Refund;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Thin wrapper around the official razorpay-java SDK - order creation, webhook signature
 * verification, and refunds (SYSTEM_DESIGN.md §6.3). Amounts are in the smallest currency unit
 * (paise for INR) at the Razorpay API boundary only; everywhere else in the app amounts stay in
 * whole-rupee BigDecimal.
 */
@Service
public class RazorpayService {

    private final RazorpayClient razorpayClient;
    private final String keyId;
    private final String webhookSecret;

    public RazorpayService(RazorpayClient razorpayClient,
                            @Value("${app.razorpay.key-id}") String keyId,
                            @Value("${app.razorpay.webhook-secret}") String webhookSecret) {
        this.razorpayClient = razorpayClient;
        this.keyId = keyId;
        this.webhookSecret = webhookSecret;
    }

    public String getKeyId() {
        return keyId;
    }

    public record CreatedOrder(String razorpayOrderId, BigDecimal amount) {
    }

    public CreatedOrder createOrder(BigDecimal amountInRupees, String receipt) {
        try {
            JSONObject request = new JSONObject();
            request.put("amount", toPaise(amountInRupees));
            request.put("currency", "INR");
            request.put("receipt", receipt);
            Order order = razorpayClient.orders.create(request);
            return new CreatedOrder(order.get("id"), amountInRupees);
        } catch (RazorpayException e) {
            throw new PaymentVerificationException("Failed to create Razorpay order: " + e.getMessage());
        }
    }

    /** Verifies the X-Razorpay-Signature header against the raw request body using the webhook secret. */
    public boolean verifyWebhookSignature(String payload, String signature) {
        if (signature == null || signature.isBlank()) {
            return false;
        }
        try {
            return Utils.verifyWebhookSignature(payload, signature, webhookSecret);
        } catch (RazorpayException e) {
            return false;
        }
    }

    public String refund(String razorpayPaymentId, BigDecimal amountInRupees) {
        try {
            JSONObject request = new JSONObject();
            request.put("amount", toPaise(amountInRupees));
            Refund refund = razorpayClient.payments.refund(razorpayPaymentId, request);
            return refund.get("id");
        } catch (RazorpayException e) {
            throw new PaymentVerificationException("Failed to process Razorpay refund: " + e.getMessage());
        }
    }

    private long toPaise(BigDecimal amountInRupees) {
        return amountInRupees.multiply(BigDecimal.valueOf(100)).longValueExact();
    }
}
