package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.ChangePasswordRequest;
import com.hackathon.starter.dto.request.UpdateProfileRequest;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.MessageResponse;
import com.hackathon.starter.dto.response.UserResponse;
import com.hackathon.starter.entity.User;
import com.hackathon.starter.mapper.UserMapper;
import com.hackathon.starter.security.UserPrincipal;
import com.hackathon.starter.service.FileStorageService;
import com.hackathon.starter.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Authenticated user profile management")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final FileStorageService fileStorageService;

    public UserController(UserService userService, UserMapper userMapper, FileStorageService fileStorageService) {
        this.userService = userService;
        this.userMapper = userMapper;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get the current authenticated user's profile")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Current user",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "401", description = "Not authenticated",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        User user = userService.getById(principal.getId());
        return ResponseEntity.ok(userMapper.toUserResponse(user));
    }

    @PutMapping("/me/profile")
    @Operation(summary = "Update the current user's profile (first/last name)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profile updated",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Not authenticated",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<UserResponse> updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                                                        @Valid @RequestBody UpdateProfileRequest request) {
        User user = userService.updateProfile(principal.getId(), request.firstName(), request.lastName());
        return ResponseEntity.ok(userMapper.toUserResponse(user));
    }

    @PutMapping("/me/photo")
    @Operation(summary = "Upload/replace the current user's profile photo",
            description = "multipart/form-data with a single 'file' part - stored locally on disk, scoped under this user's id.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profile photo updated",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "401", description = "Not authenticated",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<UserResponse> updateProfilePhoto(@AuthenticationPrincipal UserPrincipal principal,
                                                             @RequestParam("file") MultipartFile file) {
        var stored = fileStorageService.store(principal.getId(), file);
        User user = userService.updateProfileImage(principal.getId(), stored.getId());
        return ResponseEntity.ok(userMapper.toUserResponse(user));
    }

    @PutMapping("/me/password")
    @Operation(summary = "Change the current user's password",
            description = "Also bumps the user's tokenVersion, revoking every other session/device.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Password changed",
                    content = @Content(schema = @Schema(implementation = MessageResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Not authenticated, or current password incorrect",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<MessageResponse> changePassword(@AuthenticationPrincipal UserPrincipal principal,
                                                            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(principal.getId(), request.currentPassword(), request.newPassword());
        return ResponseEntity.ok(new MessageResponse("Password changed. Please log in again on other devices."));
    }
}
