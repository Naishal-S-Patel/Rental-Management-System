package com.hackathon.storage_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
public class StorageServiceApplication {

	public static void main(String[] args) throws IOException {
		// Must exist before the SQLite DataSource bean is created (Spring wires beans before any
		// CommandLineRunner executes, and the SQLite JDBC driver can create the db file but not
		// missing parent directories) - mirrors storage.root-dir's default in application.properties.
		Path storageRoot = Paths.get(System.getenv().getOrDefault("STORAGE_ROOT_DIR", "../storage"))
				.toAbsolutePath()
				.normalize();
		Files.createDirectories(storageRoot);

		SpringApplication.run(StorageServiceApplication.class, args);
	}

}
