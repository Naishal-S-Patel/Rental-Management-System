package com.hackathon.starter.config;

import com.hackathon.starter.client.MlClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

/** storage-service is no longer used (files are stored locally via FileStorageService) - only the ML placeholder client remains here. */
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient mlRestClient(@Value("${app.ml.base-url}") String baseUrl) {
        return RestClient.builder().baseUrl(baseUrl).build();
    }

    @Bean
    public MlClient mlClient(RestClient mlRestClient) {
        HttpServiceProxyFactory factory = HttpServiceProxyFactory
                .builderFor(RestClientAdapter.create(mlRestClient))
                .build();
        return factory.createClient(MlClient.class);
    }
}
