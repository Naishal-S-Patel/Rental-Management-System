package com.hackathon.storage_service.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
@EnableConfigurationProperties(StorageProperties.class)
public class StorageConfig {

    private static final Logger log = LoggerFactory.getLogger(StorageConfig.class);

    /**
     * The directory itself is already created in main() before Spring even starts (required so
     * the SQLite DataSource can create metadata.db) - this just confirms/logs the resolved path
     * once Spring's own property binding (including any override) is in effect.
     */
    @Bean
    public CommandLineRunner storageDirInitializer(StorageProperties storageProperties) {
        return args -> {
            Path root = storageProperties.resolveRootPath();
            Files.createDirectories(root);
            log.info("Storage root directory ready at {}", root);
        };
    }
}
