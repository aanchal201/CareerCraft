package com.careercraft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Body of POST /api/portfolios/generate.
 *
 * @param resumeId which saved resume to build the portfolio from
 * @param useAi    let Grok write the intro, group skills and polish project text
 * @param tone     PROFESSIONAL | FRIENDLY | BOLD (only used with AI)
 */
public record GeneratePortfolioRequest(

        @NotBlank(message = "Portfolio name is required")
        @Size(max = 120, message = "Name must be at most 120 characters")
        String name,

        @NotBlank(message = "Template is required")
        String templateId,

        @NotNull(message = "Choose a resume")
        Long resumeId,

        boolean useAi,

        @Pattern(regexp = "^$|^(PROFESSIONAL|FRIENDLY|BOLD)$", message = "Tone must be PROFESSIONAL, FRIENDLY or BOLD")
        String tone
) {
}
