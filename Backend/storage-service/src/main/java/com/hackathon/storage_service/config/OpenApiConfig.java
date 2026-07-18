package com.hackathon.storage_service.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Local Storage Service")
                        .description("Minimal local S3-like file storage - no auth, no encryption, no versioning. "
                                + "See the plan doc for the full list of deliberate omissions.")
                        .version("v1"));
    }
}
