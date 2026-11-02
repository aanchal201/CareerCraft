package com.careercraft.exception;

/**
 * The request conflicts with existing data (e.g. a portfolio address that
 * someone else already uses). Mapped to HTTP 409. If {@code field} is set,
 * the message is also returned under fieldErrors.
 */
public class ConflictException extends RuntimeException {

    private final String field;

    public ConflictException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
