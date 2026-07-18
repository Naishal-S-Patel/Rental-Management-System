package com.hackathon.starter.controller;

import com.hackathon.starter.client.MlClient;
import com.hackathon.starter.config.OpenApiConfig;
import com.hackathon.starter.dto.request.MlPredictRequest;
import com.hackathon.starter.dto.response.ErrorResponse;
import com.hackathon.starter.dto.response.MlPredictResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Placeholder proxy to a future FastAPI ML service - extend/replace once the real model
 * contract exists. Authenticated (not permitAll) since it's a real app endpoint.
 */
@RestController
@RequestMapping("/api/ml")
@Tag(name = "ML", description = "Placeholder proxy to a future FastAPI ML service")
@SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME)
public class MlController {

    private final MlClient mlClient;

    public MlController(MlClient mlClient) {
        this.mlClient = mlClient;
    }

    @PostMapping("/predict")
    @Operation(summary = "Proxy a prediction request to the FastAPI ML service",
            description = "Generic passthrough placeholder - replace the request/response shape once the real model contract exists.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Prediction result",
                    content = @Content(schema = @Schema(implementation = MlPredictResponse.class))),
            @ApiResponse(responseCode = "401", description = "Not authenticated",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<MlPredictResponse> predict(@RequestBody MlPredictRequest request) {
        return ResponseEntity.ok(mlClient.predict(request));
    }
}
