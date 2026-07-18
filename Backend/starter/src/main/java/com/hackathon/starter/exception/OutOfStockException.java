package com.hackathon.starter.exception;

/** Thrown when a requested quantity/date-range exceeds a variant's availability (SYSTEM_DESIGN.md §5.1). */
public class OutOfStockException extends RuntimeException {

    public OutOfStockException(String message) {
        super(message);
    }
}
