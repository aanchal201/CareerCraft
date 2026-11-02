package com.careercraft.dto.response;

import com.careercraft.dto.portfolio.PortfolioContent;
import com.careercraft.dto.portfolio.PortfolioDesign;

import java.time.Instant;

/**
 * What anyone on the internet gets for /p/{slug}: the published snapshot only.
 * No ids, names of drafts, or account data.
 */
public record PublicPortfolioResponse(
        String slug,
        String templateId,
        PortfolioDesign design,
        PortfolioContent content,
        String avatarPath,
        Instant publishedAt
) {
}
