package com.careercraft.dto.request;

import com.careercraft.dto.resume.ResumeContent;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Body of PUT /api/resumes/{id}. The editor sends the whole resume each time
 * (autosave), which keeps the API simple and the stored document consistent.
 */
public record UpdateResumeRequest(

        @NotBlank(message = "Resume title is required")
        @Size(max = 120, message = "Title must be at most 120 characters")
        String title,

        @NotBlank(message = "Template is required")
        String templateId,

        @NotBlank(message = "Accent color is required")
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Accent color must be a hex color like #0f766e")
        String accentColor,

        @NotNull(message = "Content is required")
        @Valid
        ResumeContent content
) {
}
