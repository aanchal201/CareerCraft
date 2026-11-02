package com.careercraft.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

/**
 * Consistent error body returned by every failing request, e.g.
 * <pre>
 * {
 *   "timestamp": "2026-11-03T10:15:30Z",
 *   "status": 400,
 *   "error": "Bad Request",
 *   "message": "Validation failed",
 *   "path": "/api/auth/register",
 *   "fieldErrors": { "email": "Please enter a valid email address" }
 * }
 * </pre>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors
) {
    public static ApiErrorResponse of(int status, String error, String message, String path) {
        return new ApiErrorResponse(Instant.now(), status, error, message, path, null);
    }

    public static ApiErrorResponse withFieldErrors(int status, String error, String message,
                                                   String path, Map<String, String> fieldErrors) {
        return new ApiErrorResponse(Instant.now(), status, error, message, path, fieldErrors);
    }
}
