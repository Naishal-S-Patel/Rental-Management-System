package com.hackathon.starter.config;

import com.hackathon.starter.security.JwtAuthenticationEntryPoint;
import com.hackathon.starter.security.JwtAuthenticationFilter;
import com.hackathon.starter.security.OAuth2AuthenticationFailureHandler;
import com.hackathon.starter.security.OAuth2AuthenticationSuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * permitAll is an explicit enumerated list of endpoints that actually exist - no blanket
 * wildcards, no rules for controllers that don't exist. Role model is two roles only
 * (PRD §1): ADMIN (org-wide rental management) and CUSTOMER (portal self-service) - every
 * hasRole(...) rule below has a real controller behind it, per the same no-dead-rule
 * principle. /api/payments/webhook is the one deliberate exception to "everything else is
 * authenticated": Razorpay calls it with no JWT, so its authenticity comes from HMAC
 * signature verification inside PaymentController itself (see SYSTEM_DESIGN.md §6.3), not
 * from this filter chain.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/auth/signup",
            "/api/auth/login",
            "/api/auth/verify",
            "/api/auth/resend-verification",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/refresh",
            "/api/auth/oauth2/exchange",
            "/api/payments/webhook",
            "/oauth2/**",
            "/login/oauth2/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/actuator/health"
    };

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final CorsConfigurationSource corsConfigurationSource;
    private final OAuth2AuthenticationSuccessHandler oAuth2SuccessHandler;
    private final OAuth2AuthenticationFailureHandler oAuth2FailureHandler;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                           JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint,
                           CorsConfigurationSource corsConfigurationSource,
                           OAuth2AuthenticationSuccessHandler oAuth2SuccessHandler,
                           OAuth2AuthenticationFailureHandler oAuth2FailureHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
        this.corsConfigurationSource = corsConfigurationSource;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
        this.oAuth2FailureHandler = oAuth2FailureHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(handling -> handling.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/attributes/**").hasRole("ADMIN")
                        .requestMatchers("/api/pricelists/**").hasRole("ADMIN")
                        .requestMatchers("/api/quotations/**", "/api/quotation-templates/**").hasRole("ADMIN")
                        .requestMatchers("/api/pickups/**", "/api/returns/**").hasRole("ADMIN")
                        .requestMatchers("/api/dashboard/**").hasRole("ADMIN")
                        .requestMatchers("/api/cart/**").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/products/**", "/api/variants/**", "/api/rental-periods/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/products/**", "/api/variants/**", "/api/rental-periods/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/products/**", "/api/variants/**", "/api/rental-periods/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/products/**", "/api/variants/**", "/api/rental-periods/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/confirm", "/api/orders/*/reject",
                                "/api/orders/*/pickup/**", "/api/orders/*/return/**", "/api/orders/*/damage-report").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/payment").hasRole("CUSTOMER")
                        .anyRequest().authenticated())
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
