package com.hackathon.starter.dto.request;

import java.util.Map;

/**
 * Deliberately generic - the real ML contract doesn't exist yet. Replace with a concrete
 * shape once the FastAPI service's actual request schema is known.
 */
public record MlPredictRequest(
        Map<String, Object> features
) {
}
