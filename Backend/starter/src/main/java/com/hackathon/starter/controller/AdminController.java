package com.hackathon.starter.controller;

import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.MessageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Backs the /api/admin/** hasRole("ADMIN") rule in SecurityConfig - the old template had
 * that rule with no controller behind it at all. Extend this as real admin features are added.
 */
@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Admin-only endpoints (requires ROLE_ADMIN)")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class AdminController {

    @GetMapping("/ping")
    @Operation(summary = "Health-check for admin access")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "pong",
                    content = @Content(schema = @Schema(implementation = MessageResponse.class))),
            @ApiResponse(responseCode = "401", description = "Not authenticated",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Authenticated but not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public MessageResponse ping() {
        return new MessageResponse("pong");
    }
}
