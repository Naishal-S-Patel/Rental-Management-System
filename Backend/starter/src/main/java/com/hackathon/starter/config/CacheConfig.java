package com.hackathon.starter.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {
    // Cache manager itself is auto-configured by spring-boot-starter-cache picking up
    // Caffeine on the classpath; cache spec comes from spring.cache.caffeine.spec in application.yml.
}
