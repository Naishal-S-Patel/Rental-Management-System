package com.hackathon.starter.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers only the bearer scheme here, deliberately not as a global security requirement -
 * that would put a misleading lock icon on genuinely public endpoints (signup, login, etc.)
 * in Swagger UI. Protected endpoints instead carry @SecurityRequirement("bearerAuth")
 * individually, so the generated spec accurately reflects which endpoints actually need a token.
 */
@Configuration
public class OpenApiConfig {

    public static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info().title("Hackathon Starter API").version("v1"))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME,
                        new SecurityScheme()
                                .name(BEARER_SCHEME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
