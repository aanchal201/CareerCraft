package com.careercraft.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * One saved AI resume analysis (history). The detailed result is stored as
 * JSON in {@code result} (see StoredAnalysis); the scores are also kept in
 * their own columns so lists can show them without parsing JSON.
 *
 * We deliberately do NOT store the full resume text - only what's needed to
 * show the analysis again.
 */
@Entity
@Table(name = "resume_analyses", indexes = @Index(name = "idx_analyses_user_created", columnList = "user_id, created_at"))
public class ResumeAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 20)
    private AnalysisSource sourceType;

    /** File name of the upload, or the title of the saved resume. */
    @Column(name = "source_name", nullable = false, length = 255)
    private String sourceName;

    /** Id of the saved resume (no FK: the resume may be deleted later). */
    @Column(name = "resume_id")
    private Long resumeId;

    @Lob
    @Column(name = "job_description", length = 20_000)
    private String jobDescription;

    @Column(name = "job_title", length = 150)
    private String jobTitle;

    @Column(name = "ats_score", nullable = false)
    private int atsScore;

    @Column(name = "match_score")
    private Integer matchScore;

    @Lob
    @Column(name = "result", nullable = false, length = 300_000)
    private String result;

    @Column(name = "model", nullable = false, length = 60)
    private String model;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ResumeAnalysis() {
        // Required by JPA
    }

    public ResumeAnalysis(User user, AnalysisSource sourceType, String sourceName, Long resumeId,
                          String jobDescription, String jobTitle, int atsScore, Integer matchScore,
                          String result, String model) {
        this.user = user;
        this.sourceType = sourceType;
        this.sourceName = sourceName;
        this.resumeId = resumeId;
        this.jobDescription = jobDescription;
        this.jobTitle = jobTitle;
        this.atsScore = atsScore;
        this.matchScore = matchScore;
        this.result = result;
        this.model = model;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public AnalysisSource getSourceType() {
        return sourceType;
    }

    public String getSourceName() {
        return sourceName;
    }

    public Long getResumeId() {
        return resumeId;
    }

    public String getJobDescription() {
        return jobDescription;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public int getAtsScore() {
        return atsScore;
    }

    public Integer getMatchScore() {
        return matchScore;
    }

    public String getResult() {
        return result;
    }

    public String getModel() {
        return model;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
