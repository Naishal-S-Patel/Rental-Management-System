package com.hackathon.starter.security;

import com.hackathon.starter.entity.User;
import com.hackathon.starter.enums.Role;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.UUID;

/**
 * Deliberately thin wrapper around only the fields the security layer needs.
 * The User entity itself never implements UserDetails - that coupling was one of the
 * old template's flaws (it loaded the entire entity into the security context on every request).
 */
@Getter
public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String passwordHash;
    private final Role role;
    private final boolean verified;
    private final int tokenVersion;

    public UserPrincipal(UUID id, String email, String passwordHash, Role role, boolean verified, int tokenVersion) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.verified = verified;
        this.tokenVersion = tokenVersion;
    }

    public static UserPrincipal from(User user) {
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getRole(),
                user.isVerified(),
                user.getTokenVersion()
        );
    }

    @Override
    public List<GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return verified;
    }
}
