package com.hackathon.starter.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

/**
 * Issues and validates both access and refresh JWTs. Neither is persisted - see
 * CLAUDE.md / the plan for why revocation is done via User.tokenVersion instead of a
 * server-side token/session table.
 */
@Service
public class JwtService {

    private static final String CLAIM_TOKEN_VERSION = "tokenVersion";
    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_TYPE = "type";
    private static final String TYPE_REFRESH = "refresh";

    private final SecretKey accessKey;
    private final SecretKey refreshKey;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String accessSecret,
            @Value("${app.jwt.refresh-secret}") String refreshSecret,
            @Value("${app.jwt.access-token-expiration-ms}") long accessTokenExpirationMs,
            @Value("${app.jwt.refresh-token-expiration-days}") long refreshTokenExpirationDays) {
        this.accessKey = Keys.hmacShaKeyFor(accessSecret.getBytes());
        this.refreshKey = Keys.hmacShaKeyFor(refreshSecret.getBytes());
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationDays * 24 * 60 * 60 * 1000;
    }

    public String generateAccessToken(UserPrincipal principal) {
        Date now = new Date();
        return Jwts.builder()
                .subject(principal.getId().toString())
                .claim(CLAIM_ROLE, principal.getRole().name())
                .claim(CLAIM_TOKEN_VERSION, principal.getTokenVersion())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + accessTokenExpirationMs))
                .signWith(accessKey)
                .compact();
    }

    public String generateRefreshToken(UserPrincipal principal) {
        Date now = new Date();
        return Jwts.builder()
                .subject(principal.getId().toString())
                .claim(CLAIM_TYPE, TYPE_REFRESH)
                .claim(CLAIM_TOKEN_VERSION, principal.getTokenVersion())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + refreshTokenExpirationMs))
                .signWith(refreshKey)
                .compact();
    }

    public UUID getUserIdFromAccessToken(String token) {
        return UUID.fromString(parseClaims(token, accessKey).getSubject());
    }

    public int getTokenVersionFromAccessToken(String token) {
        return parseClaims(token, accessKey).get(CLAIM_TOKEN_VERSION, Integer.class);
    }

    /**
     * Returns null if the token is invalid/expired/malformed rather than throwing, since
     * callers (the JWT filter) treat any such failure identically - "not authenticated".
     */
    public UUID getUserIdFromAccessTokenOrNull(String token) {
        try {
            return getUserIdFromAccessToken(token);
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public record RefreshTokenClaims(UUID userId, int tokenVersion) {
    }

    public RefreshTokenClaims parseRefreshToken(String token) {
        Claims claims = parseClaims(token, refreshKey);
        if (!TYPE_REFRESH.equals(claims.get(CLAIM_TYPE, String.class))) {
            throw new JwtException("Not a refresh token");
        }
        return new RefreshTokenClaims(
                UUID.fromString(claims.getSubject()),
                claims.get(CLAIM_TOKEN_VERSION, Integer.class));
    }

    public RefreshTokenClaims parseRefreshTokenOrNull(String token) {
        try {
            return parseRefreshToken(token);
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    private Claims parseClaims(String token, SecretKey key) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
