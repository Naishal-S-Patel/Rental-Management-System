package com.hackathon.starter.exception;

/** Thrown when a Razorpay webhook/payment signature fails HMAC verification (SYSTEM_DESIGN.md §6.3). */
public class PaymentVerificationException extends RuntimeException {

    public PaymentVerificationException(String message) {
        super(message);
    }
}
