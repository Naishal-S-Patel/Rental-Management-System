package com.hackathon.starter.security;

import com.hackathon.starter.entity.User;
import com.hackathon.starter.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Never puts a JWT in the redirect URL (that leaked into browser history/referrer headers
 * in the old template). Instead mints a one-time opaque exchange code the frontend swaps
 * for the real token pair via POST /api/auth/oauth2/exchange - see OAuth2ExchangeCache.
 */
@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final UserService userService;
    private final OAuth2ExchangeCache exchangeCache;
    private final String frontendRedirectUri;

    public OAuth2AuthenticationSuccessHandler(UserService userService,
                                               OAuth2ExchangeCache exchangeCache,
                                               @Value("${app.oauth2.frontend-redirect-uri}") String frontendRedirectUri) {
        this.userService = userService;
        this.exchangeCache = exchangeCache;
        this.frontendRedirectUri = frontendRedirectUri;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                         Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String googleId = oAuth2User.getAttribute("sub");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");

        User user = userService.findOrCreateGoogleUser(email, googleId, firstName, lastName);
        String code = exchangeCache.issueCode(user.getId());

        response.sendRedirect(frontendRedirectUri + "?code=" + code);
    }
}
