package com.hackathon.starter.exception;

/** Thrown when an action is attempted against a RentalOrder/Quotation in a status that doesn't allow it (SYSTEM_DESIGN.md §4 state machine). */
public class InvalidOrderStateException extends RuntimeException {

    public InvalidOrderStateException(String message) {
        super(message);
    }
}
