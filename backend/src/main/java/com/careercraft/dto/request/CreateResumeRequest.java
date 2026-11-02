package com.careercraft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Body of POST /api/resumes.
 *
 * @param prefillFromProfile true = copy name, contact, summary, education,
 *                           experience, skills and certifications from the profile
 */
public record CreateResumeRequest(

        @NotBlank(message = "Resume title is required")
        @Size(max = 120, message = "Title must be at most 120 characters")
        String title,

        @NotBlank(message = "Template is required")
        String templateId,

        boolean prefillFromProfile
) {
}
