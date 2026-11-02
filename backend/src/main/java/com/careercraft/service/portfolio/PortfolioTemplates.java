package com.careercraft.service.portfolio;

import java.util.Set;

/**
 * Portfolio templates the app supports. Each id has a matching React
 * component on the frontend (components/portfolio/templates).
 */
public final class PortfolioTemplates {

    public static final String MINIMAL = "minimal";
    public static final String BOLD = "bold";
    public static final String SIDEBAR = "sidebar";

    public static final Set<String> ALL = Set.of(MINIMAL, BOLD, SIDEBAR);

    private PortfolioTemplates() {
    }

    public static boolean isValid(String templateId) {
        return templateId != null && ALL.contains(templateId);
    }
}
