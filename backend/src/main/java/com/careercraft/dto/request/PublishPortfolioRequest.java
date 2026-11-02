package com.careercraft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Body of POST /api/portfolios/{id}/publish. The format rules are checked by SlugPolicy. */
public record PublishPortfolioRequest(
        @NotBlank(message = "Choose an address for your portfolio")
        @Size(max = 40, message = "The address can be at most 40 characters")
        String slug
) {
}
