package com.careercraft.exception;

/**
 * A user hit a usage limit (e.g. daily AI analyses, too many login attempts).
 * Mapped to HTTP 429. When retryAfterSeconds is set, the response also gets a
 * standard "Retry-After" header.
 */
public class TooManyRequestsException extends RuntimeException {

    private final Long retryAfterSeconds;

    public TooManyRequestsException(String message) {
        this(message, null);
    }

    public TooManyRequestsException(String message, Long retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public Long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
