package com.careercraft.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * A personal portfolio website design. Like resumes, the editable parts are
 * stored as JSON documents:
 *  - content: hero, about, skills, projects, ... and the section order/visibility
 *  - design:  accent color, light/dark mode, fonts, layout options
 * (see com.careercraft.dto.portfolio).
 *
 * Publishing (Phase 7): the public page shows {@code publishedSnapshot} - a
 * frozen copy of template + design + content taken when the user clicked
 * Publish. Editing changes only the draft (design/content) until the user
 * publishes again, so half-finished edits are never visible to visitors.
 * {@code slug} is the unique public address (/p/{slug}); it stays reserved
 * for this portfolio even while unpublished.
 */
@Entity
@Table(name = "portfolios", indexes = @Index(name = "idx_portfolios_user", columnList = "user_id"))
public class Portfolio {

    private static final int MAX_CONTENT_CHARS = 1_000_000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "template_id", nullable = false, length = 30)
    private String templateId;

    @Lob
    @Column(name = "design", nullable = false, length = 10_000)
    private String design;

    @Lob
    @Column(name = "content", nullable = false, length = MAX_CONTENT_CHARS)
    private String content;

    @Column(name = "slug", length = 40, unique = true)
    private String slug;

    @Lob
    @Column(name = "published_snapshot", length = MAX_CONTENT_CHARS)
    private String publishedSnapshot;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Portfolio() {
        // Required by JPA
    }

    public Portfolio(User user, String name, String templateId, String design, String content) {
        this.user = user;
        this.name = name;
        this.templateId = templateId;
        this.design = design;
        this.content = content;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // ---- publishing ----

    /** Freezes the given snapshot as the public version. */
    public void publish(String slug, String snapshotJson) {
        this.slug = slug;
        this.publishedSnapshot = snapshotJson;
        this.publishedAt = Instant.now();
    }

    /** Takes the public page down; the slug stays reserved for this portfolio. */
    public void unpublish() {
        this.publishedSnapshot = null;
        this.publishedAt = null;
    }

    public boolean isPublished() {
        return publishedSnapshot != null;
    }

    public String getSlug() {
        return slug;
    }

    public String getPublishedSnapshot() {
        return publishedSnapshot;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public String getDesign() {
        return design;
    }

    public void setDesign(String design) {
        this.design = design;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
