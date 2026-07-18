package com.hackathon.starter.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Official razorpay-java SDK, not @HttpExchange - the one deliberate exception to the
 * RestClient/@HttpExchange-only external-call convention (MlClient), because
 * webhook payloads need the SDK's built-in HMAC signature verification (SYSTEM_DESIGN.md §6.3).
 */
@Configuration
public class RazorpayConfig {

    @Bean
    public RazorpayClient razorpayClient(@Value("${app.razorpay.key-id}") String keyId,
                                          @Value("${app.razorpay.key-secret}") String keySecret) throws RazorpayException {
        return new RazorpayClient(keyId, keySecret);
    }
}
