package com.careercraft.exception;

/**
 * Thrown when someone tries to register with an email that is already taken.
 * Mapped to HTTP 409 Conflict by {@link GlobalExceptionHandler}.
 */
public class EmailAlreadyExistsException extends RuntimeException {

    public EmailAlreadyExistsException(String email) {
        super("An account with email '" + email + "' already exists");
    }
}
