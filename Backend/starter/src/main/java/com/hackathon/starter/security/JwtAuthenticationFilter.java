package com.hackathon.starter.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Resolves the principal by UUID (via the cached CustomUserDetailsService) and rejects
 * the token if its embedded tokenVersion claim no longer matches the user's current
 * tokenVersion - this is how revocation ("logout everywhere" / stolen-token scenarios)
 * works without ever persisting a token server-side. See CLAUDE.md.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(BEARER_PREFIX.length());
        UUID userId = jwtService.getUserIdFromAccessTokenOrNull(token);

        if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            authenticateIfVersionMatches(request, token, userId);
        }

        filterChain.doFilter(request, response);
    }

    private void authenticateIfVersionMatches(HttpServletRequest request, String token, UUID userId) {
        try {
            UserPrincipal principal = userDetailsService.loadUserById(userId);
            int tokenVersion = jwtService.getTokenVersionFromAccessToken(token);
            if (tokenVersion != principal.getTokenVersion()) {
                return; // revoked - e.g. logout-all-devices or password change since this token was issued
            }
            var authToken = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        } catch (UsernameNotFoundException e) {
            // user was deleted after the token was issued - leave unauthenticated
        }
    }
}
