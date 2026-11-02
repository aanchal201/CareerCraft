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
 * One resume belonging to a user. A user can have many (e.g. one per target role).
 *
 * The resume's sections are stored as ONE JSON document in {@code content}
 * (see com.careercraft.dto.resume.ResumeContent). Why not separate tables?
 *  - a resume is always loaded and saved as a whole;
 *  - it is a snapshot the user tailors per job, independent of their profile;
 *  - section order/visibility/titles are part of the document;
 *  - we never query inside it.
 * The service layer validates the JSON through typed Java records, so the
 * data is still structured and checked.
 */
@Entity
@Table(name = "resumes", indexes = @Index(name = "idx_resumes_user", columnList = "user_id"))
public class Resume {

    /** Hibernate maps a @Lob String of this length to MEDIUMTEXT on MySQL. */
    private static final int MAX_CONTENT_CHARS = 1_000_000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(name = "template_id", nullable = false, length = 30)
    private String templateId;

    @Column(name = "accent_color", nullable = false, length = 7)
    private String accentColor;

    @Lob
    @Column(name = "content", nullable = false, length = MAX_CONTENT_CHARS)
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Resume() {
        // Required by JPA
    }

    public Resume(User user, String title, String templateId, String accentColor, String content) {
        this.user = user;
        this.title = title;
        this.templateId = templateId;
        this.accentColor = accentColor;
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

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public String getAccentColor() {
        return accentColor;
    }

    public void setAccentColor(String accentColor) {
        this.accentColor = accentColor;
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
