package com.careercraft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Body of POST /api/portfolios.
 *
 * @param prefillFromProfile copy name, headline, about, skills, experience,
 *                           education, certifications and contact links from the profile
 */
public record CreatePortfolioRequest(

        @NotBlank(message = "Portfolio name is required")
        @Size(max = 120, message = "Name must be at most 120 characters")
        String name,

        @NotBlank(message = "Template is required")
        String templateId,

        boolean prefillFromProfile
) {
}
