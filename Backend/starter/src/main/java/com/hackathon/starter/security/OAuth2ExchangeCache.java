package com.hackathon.starter.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.hackathon.starter.util.TokenGenerator;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * A manual Caffeine bean, not the Spring Cache abstraction used for the "users" cache -
 * this is a write-once/read-once/invalidate nonce store (OAuth2 exchange codes), which
 * doesn't fit @Cacheable's declarative read-through semantics.
 */
@Component
public class OAuth2ExchangeCache {

    private final Cache<String, UUID> cache = Caffeine.newBuilder()
            .expireAfterWrite(60, TimeUnit.SECONDS)
            .maximumSize(10_000)
            .build();

    public String issueCode(UUID userId) {
        String code = TokenGenerator.generateOpaqueToken();
        cache.put(code, userId);
        return code;
    }

    /** One-time use: the code is invalidated as soon as it's read, valid or not. */
    public UUID consumeCode(String code) {
        UUID userId = cache.getIfPresent(code);
        cache.invalidate(code);
        return userId;
    }
}
