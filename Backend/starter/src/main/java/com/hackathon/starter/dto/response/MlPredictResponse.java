package com.hackathon.starter.dto.response;

import java.util.Map;

public record MlPredictResponse(
        Map<String, Object> result
) {
}
