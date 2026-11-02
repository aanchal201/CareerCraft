package com.careercraft.security;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Unit tests for the sliding-window limiter, using a fake clock (no waiting). */
class RateLimiterTest {

    private final AtomicLong now = new AtomicLong(1_000_000);
    private final RateLimiter limiter = new RateLimiter(3, Duration.ofMinutes(10), now::get);

    @Test
    void limitsAfterMaxEventsWithinTheWindow() {
        limiter.record("k");
        limiter.record("k");
        assertThat(limiter.isLimited("k")).isFalse();
        limiter.record("k");
        assertThat(limiter.isLimited("k")).isTrue();
        assertThat(limiter.isLimited("other")).isFalse();
    }

    @Test
    void oldEventsExpire() {
        limiter.record("k");
        now.addAndGet(Duration.ofMinutes(4).toMillis());
        limiter.record("k");
        limiter.record("k");
        assertThat(limiter.isLimited("k")).isTrue();
        // the first event is now 10+ minutes old
        assertThat(limiter.secondsUntilAllowed("k")).isEqualTo(Duration.ofMinutes(6).toSeconds());
        now.addAndGet(Duration.ofMinutes(6).toMillis());
        assertThat(limiter.isLimited("k")).isFalse();
        assertThat(limiter.secondsUntilAllowed("k")).isZero();
    }

    @Test
    void resetForgetsAKey() {
        limiter.record("k");
        limiter.record("k");
        limiter.record("k");
        limiter.reset("k");
        assertThat(limiter.isLimited("k")).isFalse();
    }

    @Test
    void rejectsInvalidConfiguration() {
        assertThatThrownBy(() -> new RateLimiter(0, Duration.ofMinutes(1)))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
