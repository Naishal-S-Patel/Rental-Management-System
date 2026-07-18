package com.hackathon.starter.security;

import com.hackathon.starter.entity.User;
import com.hackathon.starter.repository.UserRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Loaded by UUID (the JWT subject), not by email/username - see UserPrincipal.
 * Cached under "users" so the per-request lookup (needed for role/verified/tokenVersion
 * checks on every authenticated request) doesn't hit MySQL every time. Any mutation that
 * changes these fields (UserService.updateProfile/changePassword, revoke-all-devices) MUST
 * evict this cache entry, or a stale entry will keep being trusted.
 */
@Service
public class CustomUserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Cacheable(value = "users", key = "#id")
    public UserPrincipal loadUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));
        return UserPrincipal.from(user);
    }
}
