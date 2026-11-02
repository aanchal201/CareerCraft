package com.careercraft.dto.analysis;

import java.util.List;

/**
 * The structured answer Grok returns for a resume analysis. Its shape is
 * enforced by the JSON Schema in AnalysisPrompts, so it maps directly onto
 * these records.
 *
 * @param atsScore        0-100, the AI's estimate of ATS compatibility and overall quality
 * @param summary         2-3 sentence verdict
 * @param scoreBreakdown  one score per category (structure, impact, keywords...)
 * @param jobMatch        only present when a job description was provided
 */
public record AiAnalysis(
        int atsScore,
        String summary,
        List<ScoreItem> scoreBreakdown,
        List<String> strengths,
        List<Improvement> improvements,
        List<String> detectedSkills,
        ExperienceInsight experience,
        JobMatch jobMatch
) {

    public record ScoreItem(String category, int score, String comment) {
    }

    /**
     * @param priority   HIGH | MEDIUM | LOW
     * @param section    resume section it applies to, e.g. "Work Experience"
     * @param example    a concrete rewritten line the user can copy
     */
    public record Improvement(String priority, String section, String issue, String suggestion, String example) {
    }

    /**
     * @param seniority ENTRY | JUNIOR | MID | SENIOR | LEAD
     */
    public record ExperienceInsight(double estimatedYears, String seniority, List<String> highlights) {
    }

    public record JobMatch(
            int matchScore,
            String jobTitle,
            String verdict,
            List<String> matchedKeywords,
            List<MissingKeyword> missingKeywords,
            List<String> recommendations
    ) {
    }

    /**
     * @param importance REQUIRED | PREFERRED
     * @param suggestion where/how to add it honestly
     */
    public record MissingKeyword(String keyword, String importance, String suggestion) {
    }
}
