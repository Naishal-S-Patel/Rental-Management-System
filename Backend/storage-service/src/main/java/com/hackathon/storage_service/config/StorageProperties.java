package com.hackathon.storage_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.file.Path;
import java.nio.file.Paths;

@ConfigurationProperties(prefix = "storage")
public class StorageProperties {

    /** Relative path (e.g. "../storage") - never an absolute, machine-specific path. */
    private String rootDir;

    public String getRootDir() {
        return rootDir;
    }

    public void setRootDir(String rootDir) {
        this.rootDir = rootDir;
    }

    public Path resolveRootPath() {
        return Paths.get(rootDir).toAbsolutePath().normalize();
    }
}
