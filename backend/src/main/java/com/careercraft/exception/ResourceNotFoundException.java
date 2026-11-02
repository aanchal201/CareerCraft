package com.careercraft.exception;

/**
 * Thrown when a requested entity does not exist.
 * Mapped to HTTP 404 Not Found by {@link GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " not found with id " + id);
    }
}
