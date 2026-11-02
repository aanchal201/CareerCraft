package com.careercraft.dto.resume;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * The full content of a resume - stored as JSON in resumes.content and sent
 * to/from the frontend as-is.
 *
 * {@code sections} controls the order, visibility and title of every section
 * below the personal header. The backend normalizes it so all 8 section keys
 * are always present exactly once (see ResumeContentNormalizer).
 */
public record ResumeContent(
        @Valid ResumePersonal personal,

        @Size(max = 3000, message = "Summary must be at most 3000 characters")
        String summary,

        @Size(max = 30, message = "Too many experience entries")
        List<@Valid ResumeExperience> experience,

        @Size(max = 30, message = "Too many education entries")
        List<@Valid ResumeEducation> education,

        @Size(max = 60, message = "Too many skills")
        List<@Valid ResumeSkill> skills,

        @Size(max = 30, message = "Too many projects")
        List<@Valid ResumeProject> projects,

        @Size(max = 30, message = "Too many certifications")
        List<@Valid ResumeCertification> certifications,

        @Size(max = 30, message = "Too many achievements")
        List<@Valid ResumeAchievement> achievements,

        @Size(max = 20, message = "Too many languages")
        List<@Valid ResumeLanguage> languages,

        @Size(max = 20, message = "Too many sections")
        List<@Valid ResumeSection> sections
) {
}
