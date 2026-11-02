package com.careercraft.dto.response;

import java.time.Instant;

/** One row in the "My resumes" list (no content, to keep the list light). */
public record ResumeSummaryResponse(
        Long id,
        String title,
        String templateId,
        String accentColor,
        Instant createdAt,
        Instant updatedAt
) {
}
