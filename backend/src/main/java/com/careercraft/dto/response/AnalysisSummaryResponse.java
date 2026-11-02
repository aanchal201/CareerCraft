package com.careercraft.dto.response;

import java.time.Instant;

/** One row in the analysis history list. */
public record AnalysisSummaryResponse(
        Long id,
        String sourceType,
        String sourceName,
        Long resumeId,
        String jobTitle,
        boolean hasJobDescription,
        int atsScore,
        Integer matchScore,
        Instant createdAt
) {
}
