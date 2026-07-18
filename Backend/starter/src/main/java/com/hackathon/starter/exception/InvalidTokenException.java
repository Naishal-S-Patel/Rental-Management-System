package com.hackathon.starter.exception;

/**
 * Thrown for any invalid/expired/reused/wrong-type token - covers access tokens, refresh
 * tokens, verification tokens, and password-reset tokens alike.
 */
public class InvalidTokenException extends RuntimeException {
    public InvalidTokenException(String message) {
        super(message);
    }
}
