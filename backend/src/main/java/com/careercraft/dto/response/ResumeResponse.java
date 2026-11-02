package com.careercraft.dto.response;

import com.careercraft.dto.resume.ResumeContent;

import java.time.Instant;

/** A complete resume, as loaded by the editor. */
public record ResumeResponse(
        Long id,
        String title,
        String templateId,
        String accentColor,
        ResumeContent content,
        Instant createdAt,
        Instant updatedAt
) {
}
