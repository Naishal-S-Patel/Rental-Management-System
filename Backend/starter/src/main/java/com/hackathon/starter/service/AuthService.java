package com.hackathon.starter.service;

import com.hackathon.starter.dto.response.AuthResponse;
import com.hackathon.starter.entity.User;
import com.hackathon.starter.enums.Role;
import com.hackathon.starter.enums.TokenType;
import com.hackathon.starter.exception.InvalidTokenException;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.UserRepository;
import com.hackathon.starter.security.JwtService;
import com.hackathon.starter.security.OAuth2ExchangeCache;
import com.hackathon.starter.security.UserPrincipal;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Owns the manual signup/login/refresh flow. Login validates credentials directly against
 * UserRepository/PasswordEncoder rather than going through AuthenticationManager, since User
 * no longer implements UserDetails (see UserPrincipal) and login is keyed by email while the
 * rest of the app resolves principals by UUID.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final AuthTokenService authTokenService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OAuth2ExchangeCache oAuth2ExchangeCache;

    public AuthService(UserRepository userRepository,
                        UserService userService,
                        AuthTokenService authTokenService,
                        EmailService emailService,
                        PasswordEncoder passwordEncoder,
                        JwtService jwtService,
                        OAuth2ExchangeCache oAuth2ExchangeCache) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.authTokenService = authTokenService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.oAuth2ExchangeCache = oAuth2ExchangeCache;
    }

    @Transactional
    public void signup(String email, String password, String firstName, String lastName, Role role) {
        User user = userService.createManualUser(email, password, firstName, lastName, role);
        String rawToken = authTokenService.issueVerificationToken(user);
        emailService.sendVerificationEmail(user, rawToken);
    }

    public AuthResponse login(String email, String rawPassword) {
        User user = userRepository.findByEmail(normalize(email))
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        if (!user.isVerified()) {
            throw new DisabledException("Account is not verified");
        }
        return issueTokenPair(user);
    }

    public AuthResponse refresh(String refreshToken) {
        JwtService.RefreshTokenClaims claims = jwtService.parseRefreshTokenOrNull(refreshToken);
        if (claims == null) {
            throw new InvalidTokenException("Invalid or expired refresh token");
        }
        User user = userRepository.findById(claims.userId())
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired refresh token"));
        if (claims.tokenVersion() != user.getTokenVersion()) {
            throw new InvalidTokenException("Refresh token has been revoked");
        }
        return issueTokenPair(user);
    }

    /**
     * Consumes a one-time OAuth2 exchange code (see OAuth2AuthenticationSuccessHandler) and
     * issues a real token pair - the code itself is never a usable credential on its own.
     */
    public AuthResponse exchangeOAuth2Code(String code) {
        var userId = oAuth2ExchangeCache.consumeCode(code);
        if (userId == null) {
            throw new InvalidTokenException("Invalid or expired exchange code");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired exchange code"));
        return issueTokenPair(user);
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        var authToken = authTokenService.consumeToken(rawToken, TokenType.VERIFICATION);
        User user = authToken.getUser();
        userService.markVerified(user.getId());
        emailService.sendWelcomeEmail(user);
    }

    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmail(normalize(email))
                .orElseThrow(() -> new ResourceNotFoundException("No account found for this email"));
        if (user.isVerified()) {
            return;
        }
        String rawToken = authTokenService.issueVerificationToken(user);
        emailService.sendVerificationEmail(user, rawToken);
    }

    @Transactional
    public void forgotPassword(String email) {
        userRepository.findByEmail(normalize(email)).ifPresent(user -> {
            String rawToken = authTokenService.issuePasswordResetToken(user);
            emailService.sendPasswordResetEmail(user, rawToken);
        });
        // Deliberately no error if the email doesn't exist - avoids leaking account existence.
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        var authToken = authTokenService.consumeToken(rawToken, TokenType.PASSWORD_RESET);
        userService.resetPassword(authToken.getUser().getId(), newPassword);
    }

    private AuthResponse issueTokenPair(User user) {
        UserPrincipal principal = UserPrincipal.from(user);
        return AuthResponse.of(
                jwtService.generateAccessToken(principal),
                jwtService.generateRefreshToken(principal));
    }

    private String normalize(String email) {
        return email.strip().toLowerCase();
    }
}
