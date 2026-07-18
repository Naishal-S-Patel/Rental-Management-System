package com.hackathon.starter.scheduler;

import com.hackathon.starter.service.AuthTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Deletes expired/used verification and password-reset rows from auth_tokens daily - the old
 * template had the repository methods for this but never actually scheduled the cleanup, so
 * rows accumulated forever.
 */
@Component
public class TokenCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(TokenCleanupScheduler.class);

    private final AuthTokenService authTokenService;

    public TokenCleanupScheduler(AuthTokenService authTokenService) {
        this.authTokenService = authTokenService;
    }

    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupExpiredTokens() {
        log.debug("Running scheduled auth_tokens cleanup");
        authTokenService.cleanupExpiredAndUsedTokens();
    }
}
