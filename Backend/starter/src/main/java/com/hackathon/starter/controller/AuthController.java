package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.ForgotPasswordRequest;
import com.hackathon.starter.dto.request.LoginRequest;
import com.hackathon.starter.dto.request.OAuth2ExchangeRequest;
import com.hackathon.starter.dto.request.RefreshTokenRequest;
import com.hackathon.starter.dto.request.ResendVerificationRequest;
import com.hackathon.starter.dto.request.ResetPasswordRequest;
import com.hackathon.starter.dto.request.SignupRequest;
import com.hackathon.starter.dto.request.VerifyEmailRequest;
import com.hackathon.starter.dto.response.AuthResponse;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.MessageResponse;
import com.hackathon.starter.security.UserPrincipal;
import com.hackathon.starter.service.AuthService;
import com.hackathon.starter.service.UserService;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth", description = "Authentication, registration, and account-recovery flows")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/signup")
    @RateLimiter(name = "signupLimiter")
    @Operation(summary = "Create a new account",
            description = "Registers a manual (email/password) account and sends a verification email asynchronously.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Account created",
                    content = @Content(schema = @Schema(implementation = MessageResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Email already registered",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Too many signup attempts",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<MessageResponse> signup(@Valid @RequestBody SignupRequest request) {
        authService.signup(request.email(), request.password(), request.firstName(), request.lastName(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MessageResponse("Account created. Please check your email to verify your account."));
    }

    @PostMapping("/login")
    @RateLimiter(name = "loginLimiter")
    @Operation(summary = "Log in", description = "Returns a short-lived access token and a longer-lived refresh token.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Authenticated",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid email or password",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Account not verified",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Too many login attempts",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request.email(), request.password()));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh the access token",
            description = "Exchanges a valid refresh token for a new access+refresh pair (rotation). "
                    + "Rejected if the token's embedded tokenVersion no longer matches the user's current one (revoked).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "New token pair issued",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid, expired, or revoked refresh token",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request.refreshToken()));
    }

    @PostMapping("/logout")
    @SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
    @Operation(summary = "Log out the current session",
            description = "Stateless by design - there is nothing server-side to invalidate for a single session. "
                    + "The client simply discards both tokens. Use /logout-all-devices to actually revoke access.")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Logged out",
            content = @Content(schema = @Schema(implementation = MessageResponse.class))))
    public ResponseEntity<MessageResponse> logout() {
        return ResponseEntity.ok(new MessageResponse("Logged out"));
    }

    @PostMapping("/logout-all-devices")
    @SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
    @Operation(summary = "Revoke every issued session",
            description = "Bumps the user's tokenVersion, instantly invalidating every previously issued access "
                    + "and refresh token - use this for a stolen-token/compromised-session scenario.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "All sessions revoked",
                    content = @Content(schema = @Schema(implementation = MessageResponse.class))),
            @ApiResponse(responseCode = "401", description = "Not authenticated",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<MessageResponse> logoutAllDevices(@AuthenticationPrincipal UserPrincipal principal) {
        userService.revokeAllSessions(principal.getId());
        return ResponseEntity.ok(new MessageResponse("All sessions have been revoked"));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify an email address using the token from the verification email")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Email verified",
                    content = @Content(schema = @Schema(implementation = MessageResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid or expired verification token",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<MessageResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request.token());
        return ResponseEntity.ok(new MessageResponse("Email verified successfully"));
    }

    @PostMapping("/resend-verification")
    @RateLimiter(name = "resendVerificationLimiter")
    @Operation(summary = "Resend the verification email",
            description = "Always returns 200 regardless of whether the account exists or is already verified, "
                    + "to avoid leaking account existence.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Request accepted",
                    content = @Content(schema = @Schema(implementation = MessageResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Too many requests",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<MessageResponse> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request.email());
        return ResponseEntity.ok(new MessageResponse("If an unverified account exists for this email, a new verification link has been sent."));
    }

    @PostMapping("/forgot-password")
    @RateLimiter(name = "forgotPasswordLimiter")
    @Operation(summary = "Request a password reset email",
            description = "Always returns 200 regardless of whether the account exists, to avoid leaking account existence.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Request accepted",
                    content = @Content(schema = @Schema(implementation = MessageResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Too many requests",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ResponseEntity.ok(new MessageResponse("If an account exists for this email, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset a password using the token from the password-reset email")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Password reset",
                    content = @Content(schema = @Schema(implementation = MessageResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid/expired token or validation failure",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(new MessageResponse("Password reset successfully"));
    }

    @PostMapping("/oauth2/exchange")
    @Operation(summary = "Exchange a one-time OAuth2 code for a token pair",
            description = "Called by the frontend immediately after the Google OAuth2 redirect. The code is single-use "
                    + "and short-lived (60s) - see OAuth2AuthenticationSuccessHandler. No JWT is ever put in a redirect URL.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Authenticated",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid or expired exchange code",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AuthResponse> exchangeOAuth2Code(@Valid @RequestBody OAuth2ExchangeRequest request) {
        return ResponseEntity.ok(authService.exchangeOAuth2Code(request.code()));
    }
}
