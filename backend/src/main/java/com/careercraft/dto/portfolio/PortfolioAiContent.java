package com.careercraft.dto.portfolio;

import java.util.List;

/**
 * What Grok writes for a portfolio (structured output, see PortfolioAiWriter).
 * Returned to the editor as suggestions, or merged into a generated portfolio.
 *
 * @param skillGroups          the user's existing skills, grouped (no new skills)
 * @param projectDescriptions  polished descriptions for the user's existing projects
 */
public record PortfolioAiContent(
        String headline,
        String tagline,
        String about,
        String contactMessage,
        List<SkillGroup> skillGroups,
        List<ProjectDescription> projectDescriptions
) {

    public record SkillGroup(String category, List<String> skills) {
    }

    public record ProjectDescription(String name, String description) {
    }
}
