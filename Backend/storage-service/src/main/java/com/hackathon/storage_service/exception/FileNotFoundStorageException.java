package com.hackathon.storage_service.exception;

public class FileNotFoundStorageException extends RuntimeException {
    public FileNotFoundStorageException(String message) {
        super(message);
    }
}
