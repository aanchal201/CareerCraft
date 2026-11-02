package com.careercraft.ai;

import org.springframework.http.HttpStatus;

/**
 * Something went wrong talking to the AI provider. Carries the HTTP status
 * we should return to OUR client (e.g. 502 Bad Gateway, 504 Gateway Timeout)
 * and a user-friendly message - never the provider's raw error or our key.
 */
public class AiServiceException extends RuntimeException {

    private final HttpStatus status;

    public AiServiceException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public AiServiceException(String message, HttpStatus status, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    /** No API key / model configured on the server. */
    public static AiServiceException notConfigured() {
        return new AiServiceException(
                "AI features are not configured on the server. Add GROK_API_KEY to backend/.env and restart.",
                HttpStatus.SERVICE_UNAVAILABLE);
    }
}
