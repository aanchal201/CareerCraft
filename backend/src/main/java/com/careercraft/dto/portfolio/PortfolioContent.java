package com.careercraft.dto.portfolio;

import com.careercraft.dto.resume.ResumeFormats;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Everything shown on a portfolio site. Stored as JSON in portfolios.content.
 * The hero is always first; {@code sections} controls the order, visibility
 * and headings of the rest (normalized so all 7 keys are always present).
 *
 * Dates use "YYYY-MM" and URLs must start with http(s):// - the same rules as
 * resumes (ResumeFormats).
 */
public record PortfolioContent(
        @Valid Hero hero,
        @Valid About about,
        @Size(max = 60) List<@Valid Skill> skills,
        @Size(max = 30) List<@Valid Project> projects,
        @Size(max = 30) List<@Valid Experience> experience,
        @Size(max = 30) List<@Valid Education> education,
        @Size(max = 30) List<@Valid Certification> certifications,
        @Valid Contact contact,
        @Size(max = 20) List<@Valid Section> sections
) {

    /**
     * @param availability short badge text, e.g. "Open to work" (empty = hidden)
     * @param ctaLabel     main button text, e.g. "Get in touch"
     * @param showAvatar   show the profile picture from the user's profile
     */
    public record Hero(
            @Size(max = 100) String name,
            @Size(max = 120) String headline,
            @Size(max = 300) String tagline,
            @Size(max = 60) String availability,
            @Size(max = 40) String ctaLabel,
            boolean showAvatar
    ) {
    }

    public record About(
            @Size(max = 3000) String text,
            @Size(max = 100) String location
    ) {
    }

    /** category groups skills on the page, e.g. "Frontend", "Tools". */
    public record Skill(
            @Size(max = 40) String id,
            @Size(max = 60) String name,
            @Size(max = 40) String category
    ) {
    }

    public record Project(
            @Size(max = 40) String id,
            @Size(max = 120) String name,
            @Size(max = 1500) String description,
            @Size(max = 200) String technologies,
            @Size(max = 255) @Pattern(regexp = ResumeFormats.URL, message = ResumeFormats.URL_MESSAGE) String liveUrl,
            @Size(max = 255) @Pattern(regexp = ResumeFormats.URL, message = ResumeFormats.URL_MESSAGE) String repoUrl,
            @Size(max = 500) @Pattern(regexp = ResumeFormats.URL, message = ResumeFormats.URL_MESSAGE) String imageUrl,
            boolean featured
    ) {
    }

    public record Experience(
            @Size(max = 40) String id,
            @Size(max = 120) String jobTitle,
            @Size(max = 150) String company,
            @Size(max = 100) String location,
            @Pattern(regexp = ResumeFormats.MONTH, message = ResumeFormats.MONTH_MESSAGE) String startDate,
            @Pattern(regexp = ResumeFormats.MONTH, message = ResumeFormats.MONTH_MESSAGE) String endDate,
            boolean current,
            @Size(max = 2000) String description
    ) {
    }

    public record Education(
            @Size(max = 40) String id,
            @Size(max = 150) String institution,
            @Size(max = 120) String degree,
            @Size(max = 120) String fieldOfStudy,
            @Pattern(regexp = ResumeFormats.MONTH, message = ResumeFormats.MONTH_MESSAGE) String startDate,
            @Pattern(regexp = ResumeFormats.MONTH, message = ResumeFormats.MONTH_MESSAGE) String endDate,
            boolean current,
            @Size(max = 1000) String description
    ) {
    }

    public record Certification(
            @Size(max = 40) String id,
            @Size(max = 150) String name,
            @Size(max = 150) String issuer,
            @Pattern(regexp = ResumeFormats.MONTH, message = ResumeFormats.MONTH_MESSAGE) String date,
            @Size(max = 255) @Pattern(regexp = ResumeFormats.URL, message = ResumeFormats.URL_MESSAGE) String link
    ) {
    }

    /** message: a short invitation shown above the contact links. */
    public record Contact(
            @Size(max = 300) String message,
            @Size(max = 150) String email,
            @Size(max = 30) String phone,
            @Size(max = 255) @Pattern(regexp = ResumeFormats.URL, message = ResumeFormats.URL_MESSAGE) String linkedin,
            @Size(max = 255) @Pattern(regexp = ResumeFormats.URL, message = ResumeFormats.URL_MESSAGE) String github,
            @Size(max = 255) @Pattern(regexp = ResumeFormats.URL, message = ResumeFormats.URL_MESSAGE) String website
    ) {
    }

    /** key: about | skills | projects | experience | education | certifications | contact */
    public record Section(
            @Size(max = 30) String key,
            @Size(max = 60) String title,
            boolean visible
    ) {
    }
}
