package com.hackathon.starter.service;

import com.hackathon.starter.entity.AuthToken;
import com.hackathon.starter.entity.User;
import com.hackathon.starter.enums.TokenType;
import com.hackathon.starter.exception.InvalidTokenException;
import com.hackathon.starter.repository.AuthTokenRepository;
import com.hackathon.starter.util.TokenGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Owns the auth_tokens table - VERIFICATION and PASSWORD_RESET only. Refresh tokens are
 * NOT handled here; they're stateless JWTs (see JwtService / UserService.revokeAllSessions).
 */
@Service
public class AuthTokenService {

    private static final long VERIFICATION_TOKEN_TTL_HOURS = 24;
    private static final long PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

    private final AuthTokenRepository authTokenRepository;

    public AuthTokenService(AuthTokenRepository authTokenRepository) {
        this.authTokenRepository = authTokenRepository;
    }

    @Transactional
    public String issueVerificationToken(User user) {
        return issueToken(user, TokenType.VERIFICATION, VERIFICATION_TOKEN_TTL_HOURS * 60);
    }

    @Transactional
    public String issuePasswordResetToken(User user) {
        return issueToken(user, TokenType.PASSWORD_RESET, PASSWORD_RESET_TOKEN_TTL_MINUTES);
    }

    private String issueToken(User user, TokenType type, long ttlMinutes) {
        authTokenRepository.deleteAllByUserIdAndTokenType(user.getId(), type);
        String rawToken = TokenGenerator.generateOpaqueToken();
        AuthToken authToken = AuthToken.builder()
                .tokenHash(TokenGenerator.sha256(rawToken))
                .tokenType(type)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(ttlMinutes))
                .build();
        authTokenRepository.save(authToken);
        return rawToken;
    }

    /**
     * Validates and marks the token used in one step - both verification and password-reset
     * tokens are single-use.
     */
    @Transactional
    public AuthToken consumeToken(String rawToken, TokenType type) {
        AuthToken authToken = authTokenRepository.findByTokenHashAndTokenTypeAndUsedFalse(
                        TokenGenerator.sha256(rawToken), type)
                .orElseThrow(() -> new InvalidTokenException("Invalid or already-used token"));
        if (authToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Token has expired");
        }
        authToken.setUsed(true);
        authTokenRepository.save(authToken);
        return authToken;
    }

    @Transactional
    public void cleanupExpiredAndUsedTokens() {
        authTokenRepository.deleteAllByExpiryDateBeforeOrUsedTrue(LocalDateTime.now());
    }
}
