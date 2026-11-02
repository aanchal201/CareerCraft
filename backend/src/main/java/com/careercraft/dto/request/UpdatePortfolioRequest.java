package com.careercraft.dto.request;

import com.careercraft.dto.portfolio.PortfolioContent;
import com.careercraft.dto.portfolio.PortfolioDesign;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Body of PUT /api/portfolios/{id} - the editor sends the whole document (autosave). */
public record UpdatePortfolioRequest(

        @NotBlank(message = "Portfolio name is required")
        @Size(max = 120, message = "Name must be at most 120 characters")
        String name,

        @NotBlank(message = "Template is required")
        String templateId,

        @NotNull(message = "Design is required")
        @Valid
        PortfolioDesign design,

        @NotNull(message = "Content is required")
        @Valid
        PortfolioContent content
) {
}
