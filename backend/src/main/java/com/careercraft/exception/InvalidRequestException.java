package com.careercraft.exception;

/**
 * A business-rule validation failure that @Valid annotations can't express
 * (e.g. "end date before start date"). Mapped to HTTP 400.
 *
 * If {@code field} is set, the error is also returned under fieldErrors so
 * the frontend can highlight that input.
 */
public class InvalidRequestException extends RuntimeException {

    private final String field;

    public InvalidRequestException(String message) {
        this(null, message);
    }

    public InvalidRequestException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
