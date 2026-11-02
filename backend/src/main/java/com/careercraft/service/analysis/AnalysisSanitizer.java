package com.careercraft.service.analysis;

import com.careercraft.dto.analysis.AiAnalysis;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

/**
 * Defensive clean-up of the AI's answer before we store or show it.
 * Even with a strict schema we never fully trust model output: clamp
 * numbers, cap list sizes, drop empty strings and normalize enum values.
 */
@Component
public class AnalysisSanitizer {

    private static final Set<String> PRIORITIES = Set.of("HIGH", "MEDIUM", "LOW");
    private static final Set<String> SENIORITY = Set.of("ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD");
    private static final Set<String> IMPORTANCE = Set.of("REQUIRED", "PREFERRED");

    public AiAnalysis sanitize(AiAnalysis a, boolean expectJobMatch) {
        AiAnalysis.ExperienceInsight exp = a.experience();
        AiAnalysis.ExperienceInsight cleanExperience = exp == null
                ? new AiAnalysis.ExperienceInsight(0, "ENTRY", List.of())
                : new AiAnalysis.ExperienceInsight(
                        Math.max(0, Math.min(60, Math.round(exp.estimatedYears() * 10) / 10.0)),
                        oneOf(exp.seniority(), SENIORITY, "ENTRY"),
                        texts(exp.highlights(), 4));

        AiAnalysis.JobMatch match = null;
        if (expectJobMatch && a.jobMatch() != null) {
            AiAnalysis.JobMatch m = a.jobMatch();
            match = new AiAnalysis.JobMatch(
                    clamp(m.matchScore()),
                    trim(m.jobTitle(), 150),
                    trim(m.verdict(), 1000),
                    texts(m.matchedKeywords(), 25),
                    safe(m.missingKeywords()).stream()
                            .filter(k -> k != null && notBlank(k.keyword()))
                            .limit(20)
                            .map(k -> new AiAnalysis.MissingKeyword(trim(k.keyword(), 80),
                                    oneOf(k.importance(), IMPORTANCE, "PREFERRED"), trim(k.suggestion(), 500)))
                            .toList(),
                    texts(m.recommendations(), 5));
        }

        return new AiAnalysis(
                clamp(a.atsScore()),
                trim(a.summary(), 1500),
                safe(a.scoreBreakdown()).stream()
                        .filter(Objects::nonNull)
                        .limit(5)
                        .map(s -> new AiAnalysis.ScoreItem(trim(s.category(), 60), clamp(s.score()), trim(s.comment(), 500)))
                        .toList(),
                texts(a.strengths(), 6),
                safe(a.improvements()).stream()
                        .filter(i -> i != null && (notBlank(i.issue()) || notBlank(i.suggestion())))
                        .limit(8)
                        .map(i -> new AiAnalysis.Improvement(oneOf(i.priority(), PRIORITIES, "MEDIUM"),
                                trim(i.section(), 80), trim(i.issue(), 600), trim(i.suggestion(), 800),
                                trim(i.example(), 800)))
                        .toList(),
                texts(a.detectedSkills(), 30),
                cleanExperience,
                match
        );
    }

    static int clamp(int score) {
        return Math.max(0, Math.min(100, score));
    }

    private static String oneOf(String value, Set<String> allowed, String fallback) {
        String upper = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        return allowed.contains(upper) ? upper : fallback;
    }

    private static List<String> texts(List<String> values, int max) {
        return safe(values).stream().filter(AnalysisSanitizer::notBlank).map(v -> trim(v, 300)).distinct().limit(max).toList();
    }

    private static <T> List<T> safe(List<T> list) {
        return list == null ? List.of() : list;
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    private static String trim(String value, int max) {
        if (value == null) return "";
        String trimmed = value.trim();
        return trimmed.length() > max ? trimmed.substring(0, max) : trimmed;
    }
}
