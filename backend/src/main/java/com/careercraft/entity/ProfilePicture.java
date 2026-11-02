package com.careercraft.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Profile picture bytes, stored in MySQL.
 *
 * Why the database and not the server's disk? Render/Railway containers have
 * an ephemeral filesystem - uploaded files vanish on every redeploy. Images are
 * small (max 2 MB), so the database is a simple, reliable home for them.
 *
 * Kept in its own table so loading a Profile never loads the image bytes.
 */
@Entity
@Table(name = "profile_pictures")
public class ProfilePicture {

    /** Hibernate maps a @Lob byte[] of this length to MEDIUMBLOB on MySQL. */
    private static final int MAX_BYTES = 5 * 1024 * 1024;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Lob
    @Column(name = "data", nullable = false, length = MAX_BYTES)
    private byte[] data;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ProfilePicture() {
        // Required by JPA
    }

    public ProfilePicture(User user) {
        this.user = user;
    }

    /** Replaces the image and bumps updatedAt (used for cache-busting URLs). */
    public void replaceImage(String contentType, byte[] data) {
        this.contentType = contentType;
        this.data = data;
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getContentType() {
        return contentType;
    }

    public byte[] getData() {
        return data;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
