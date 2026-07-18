package com.hackathon.starter.repository;

import com.hackathon.starter.entity.AuthToken;
import com.hackathon.starter.enums.TokenType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {

    Optional<AuthToken> findByTokenHashAndTokenType(String tokenHash, TokenType tokenType);

    Optional<AuthToken> findByTokenHashAndTokenTypeAndUsedFalse(String tokenHash, TokenType tokenType);

    void deleteAllByUserIdAndTokenType(UUID userId, TokenType tokenType);

    void deleteAllByExpiryDateBeforeOrUsedTrue(LocalDateTime cutoff);
}
