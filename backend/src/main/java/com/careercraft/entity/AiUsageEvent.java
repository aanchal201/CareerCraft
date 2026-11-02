package com.careercraft.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * One AI request made by a user for a feature (e.g. PORTFOLIO_GENERATE).
 * Used to enforce daily limits and keep API costs predictable.
 * (Resume analyses are counted from their own table - see Phase 5.)
 */
@Entity
@Table(name = "ai_usage_events", indexes = @Index(name = "idx_ai_usage_user_created", columnList = "user_id, created_at"))
public class AiUsageEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 40)
    private String feature;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AiUsageEvent() {
        // Required by JPA
    }

    public AiUsageEvent(Long userId, String feature) {
        this.userId = userId;
        this.feature = feature;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getFeature() {
        return feature;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
