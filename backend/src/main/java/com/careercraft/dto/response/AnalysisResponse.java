package com.careercraft.dto.response;

import com.careercraft.dto.analysis.AiAnalysis;
import com.careercraft.dto.analysis.AtsCheck;

import java.time.Instant;
import java.util.List;

/**
 * A complete analysis.
 *
 * @param atsScore    final estimated ATS score = 70% AI score + 30% rule-based checks
 * @param aiScore     the AI's own score
 * @param checksScore % of rule-based checks passed
 */
public record AnalysisResponse(
        Long id,
        String sourceType,
        String sourceName,
        Long resumeId,
        String jobTitle,
        String jobDescription,
        int atsScore,
        int aiScore,
        int checksScore,
        Integer matchScore,
        int wordCount,
        AiAnalysis ai,
        List<AtsCheck> atsChecks,
        String model,
        Instant createdAt
) {
}
