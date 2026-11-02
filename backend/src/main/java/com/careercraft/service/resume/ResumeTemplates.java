package com.careercraft.service.resume;

import java.util.Set;

/**
 * The resume templates the app supports. Each id has a matching React
 * component on the frontend (components/resume/templates).
 */
public final class ResumeTemplates {

    public static final String CLASSIC = "classic";
    public static final String MODERN = "modern";
    public static final String MINIMAL = "minimal";

    public static final Set<String> ALL = Set.of(CLASSIC, MODERN, MINIMAL);

    public static final String DEFAULT_ACCENT = "#0f766e";

    private ResumeTemplates() {
    }

    public static boolean isValid(String templateId) {
        return templateId != null && ALL.contains(templateId);
    }
}
