package com.careercraft.dto.analysis;

import java.util.List;

/**
 * Everything we store (as JSON) for one analysis.
 *
 * @param ai          Grok's structured answer
 * @param atsChecks   rule-based checks computed locally
 * @param aiScore     Grok's own ATS score (0-100)
 * @param checksScore % of rule-based checks passed (0-100)
 * @param wordCount   words in the analyzed resume text
 */
public record StoredAnalysis(
        AiAnalysis ai,
        List<AtsCheck> atsChecks,
        int aiScore,
        int checksScore,
        int wordCount
) {
}
