package com.hackathon.starter.client;

import com.hackathon.starter.dto.request.MlPredictRequest;
import com.hackathon.starter.dto.response.MlPredictResponse;
import org.springframework.web.service.annotation.PostExchange;

/**
 * Declarative HTTP client for a future FastAPI ML service - built on RestClient (the
 * RestTemplate replacement) via @HttpExchange rather than OpenFeign, avoiding an extra
 * Spring Cloud dependency of uncertain Spring Boot 4 compatibility. Placeholder: replace
 * the method signature once the real ML contract exists.
 */
public interface MlClient {

    @PostExchange("/predict")
    MlPredictResponse predict(MlPredictRequest request);
}
