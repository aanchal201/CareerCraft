package com.careercraft.security;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

/**
 * Small in-memory sliding-window counter: "at most N events per key within
 * the last W". Used to slow down password guessing and sign-up spam.
 *
 * In-memory means the counts live in this server's RAM: they reset on restart
 * and aren't shared between several instances. That's fine for a single
 * Render/Railway instance. With several instances, move this to Redis.
 *
 * Thread-safe: each key's timestamps are guarded by synchronizing on the deque.
 */
public class RateLimiter {

    /** Clean up idle keys when the map grows past this, so memory stays bounded. */
    private static final int CLEANUP_THRESHOLD = 10_000;

    private final int maxEvents;
    private final long windowMillis;
    private final LongSupplier clock;
    private final Map<String, Deque<Long>> events = new ConcurrentHashMap<>();

    public RateLimiter(int maxEvents, Duration window) {
        this(maxEvents, window, System::currentTimeMillis);
    }

    /** Constructor with a custom clock, for unit tests. */
    public RateLimiter(int maxEvents, Duration window, LongSupplier clock) {
        if (maxEvents < 1) throw new IllegalArgumentException("maxEvents must be at least 1");
        this.maxEvents = maxEvents;
        this.windowMillis = window.toMillis();
        this.clock = clock;
    }

    /** True if the key has already used up its allowance in the current window. */
    public boolean isLimited(String key) {
        Deque<Long> timestamps = events.get(key);
        if (timestamps == null) return false;
        synchronized (timestamps) {
            prune(timestamps, clock.getAsLong());
            return timestamps.size() >= maxEvents;
        }
    }

    /** Counts one event for the key. */
    public void record(String key) {
        long now = clock.getAsLong();
        Deque<Long> timestamps = events.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            prune(timestamps, now);
            timestamps.addLast(now);
        }
        if (events.size() > CLEANUP_THRESHOLD) cleanup(now);
    }

    /** Seconds until the key can act again (0 if it isn't limited). */
    public long secondsUntilAllowed(String key) {
        Deque<Long> timestamps = events.get(key);
        if (timestamps == null) return 0;
        synchronized (timestamps) {
            long now = clock.getAsLong();
            prune(timestamps, now);
            if (timestamps.size() < maxEvents) return 0;
            // the oldest event that must expire before a new one is allowed
            long oldestRelevant = timestamps.stream()
                    .skip(timestamps.size() - maxEvents)
                    .findFirst()
                    .orElse(now);
            long waitMillis = oldestRelevant + windowMillis - now;
            return Math.max(1, (waitMillis + 999) / 1000);
        }
    }

    /** Forgets the key's history (e.g. after a successful login). */
    public void reset(String key) {
        events.remove(key);
    }

    /** Forgets everything. Used by tests. */
    public void clear() {
        events.clear();
    }

    private void prune(Deque<Long> timestamps, long now) {
        while (!timestamps.isEmpty() && timestamps.peekFirst() <= now - windowMillis) {
            timestamps.pollFirst();
        }
    }

    private void cleanup(long now) {
        events.entrySet().removeIf(entry -> {
            Deque<Long> timestamps = entry.getValue();
            synchronized (timestamps) {
                prune(timestamps, now);
                return timestamps.isEmpty();
            }
        });
    }
}
