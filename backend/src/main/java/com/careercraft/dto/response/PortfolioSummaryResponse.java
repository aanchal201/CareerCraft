package com.careercraft.dto.response;

import java.time.Instant;

/** One row in the "My portfolios" list. */
public record PortfolioSummaryResponse(
        Long id,
        String name,
        String templateId,
        String primaryColor,
        String colorMode,
        String slug,
        boolean published,
        Instant createdAt,
        Instant updatedAt
) {
}
