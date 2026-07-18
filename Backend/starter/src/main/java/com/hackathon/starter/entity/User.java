package com.hackathon.starter.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hackathon.starter.enums.AuthProvider;
import com.hackathon.starter.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * UUID PK is deliberate here: it's exposed as the JWT {@code sub} claim and in API responses,
 * so a sequential id would let clients enumerate users. See CLAUDE.md for the broader rationale.
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_email", columnList = "email"),
        @Index(name = "idx_users_google_id", columnList = "google_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @JsonIgnore
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "first_name", length = 50)
    private String firstName;

    @Column(name = "last_name", length = 50)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 20)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.MANUAL;

    @Column(name = "google_id", unique = true, length = 100)
    private String googleId;

    /** StoredFile id for the profile photo - no FK, resolved via FileStorageService. */
    @Column(name = "profile_image_file_id")
    private UUID profileImageFileId;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean verified = false;

    /**
     * The only piece of server-side auth state. Bumping this invalidates every previously
     * issued access + refresh JWT for this user (see JwtAuthenticationFilter / AuthService).
     */
    @Column(name = "token_version", nullable = false)
    @Builder.Default
    private int tokenVersion = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
