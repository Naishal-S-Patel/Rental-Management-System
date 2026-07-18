package com.hackathon.starter.service;

import com.hackathon.starter.entity.User;
import com.hackathon.starter.enums.AuthProvider;
import com.hackathon.starter.enums.Role;
import com.hackathon.starter.exception.BadRequestException;
import com.hackathon.starter.exception.EmailAlreadyExistsException;
import com.hackathon.starter.exception.ResourceNotFoundException;
import com.hackathon.starter.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Single point of user creation/lookup so email normalization and default-role assignment
 * can't drift across signup/OAuth2 paths the way they did in the old template (three separate
 * places, inconsistent lowercasing). Also owns every mutation that must evict the cached
 * principal (see CustomUserDetailsService) - forgetting an eviction here means a stale
 * cached user/tokenVersion keeps being trusted after a change.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private String normalize(String email) {
        return email.strip().toLowerCase();
    }

    /** Default role for accounts created via Google OAuth2, which has no self-service role picker in the redirect flow. */
    private static final Role DEFAULT_OAUTH2_ROLE = Role.CUSTOMER;

    @Transactional
    public User createManualUser(String email, String rawPassword, String firstName, String lastName, Role requestedRole) {
        if (requestedRole == Role.ADMIN) {
            throw new BadRequestException("ADMIN cannot be self-assigned at signup");
        }
        String normalizedEmail = normalize(email);
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("An account with this email already exists");
        }
        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .firstName(firstName)
                .lastName(lastName)
                .role(requestedRole)
                .authProvider(AuthProvider.MANUAL)
                .build();
        return userRepository.save(user);
    }

    @Transactional
    public User findOrCreateGoogleUser(String email, String googleId, String firstName, String lastName) {
        String normalizedEmail = normalize(email);
        return userRepository.findByEmail(normalizedEmail)
                .map(existing -> linkGoogleIdIfMissing(existing, googleId))
                .orElseGet(() -> userRepository.save(User.builder()
                        .email(normalizedEmail)
                        .googleId(googleId)
                        .firstName(firstName)
                        .lastName(lastName)
                        .role(DEFAULT_OAUTH2_ROLE)
                        .authProvider(AuthProvider.GOOGLE)
                        .verified(true)
                        .build()));
    }

    private User linkGoogleIdIfMissing(User user, String googleId) {
        if (user.getGoogleId() == null) {
            user.setGoogleId(googleId);
            user.setVerified(true);
            return userRepository.save(user);
        }
        return user;
    }

    public User getById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @CacheEvict(value = "users", key = "#userId")
    @Transactional
    public User updateProfile(UUID userId, String firstName, String lastName) {
        User user = getById(userId);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        return userRepository.save(user);
    }

    @CacheEvict(value = "users", key = "#userId")
    @Transactional
    public User updateProfileImage(UUID userId, UUID fileId) {
        User user = getById(userId);
        user.setProfileImageFileId(fileId);
        return userRepository.save(user);
    }

    @CacheEvict(value = "users", key = "#userId")
    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        User user = getById(userId);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setTokenVersion(user.getTokenVersion() + 1); // password change revokes all existing sessions
        userRepository.save(user);
    }

    @CacheEvict(value = "users", key = "#userId")
    @Transactional
    public void markVerified(UUID userId) {
        User user = getById(userId);
        user.setVerified(true);
        userRepository.save(user);
    }

    @CacheEvict(value = "users", key = "#userId")
    @Transactional
    public void resetPassword(UUID userId, String newPassword) {
        User user = getById(userId);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
    }

    /**
     * "Logout everywhere" / stolen-token remediation: bumping tokenVersion instantly
     * invalidates every access + refresh JWT issued before this point, without ever having
     * stored a single one server-side.
     */
    @CacheEvict(value = "users", key = "#userId")
    @Transactional
    public void revokeAllSessions(UUID userId) {
        User user = getById(userId);
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
    }
}
