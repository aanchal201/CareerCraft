package com.careercraft.dto.response;

import com.careercraft.dto.portfolio.PortfolioContent;
import com.careercraft.dto.portfolio.PortfolioDesign;
import com.careercraft.dto.portfolio.PortfolioPublishing;

import java.time.Instant;

/**
 * A complete portfolio, as loaded by the editor.
 *
 * @param avatarPath the owner's profile picture ("/users/1/avatar?v=..."), or null
 * @param publishing slug, live status and whether the draft has unpublished changes
 */
public record PortfolioResponse(
        Long id,
        String name,
        String templateId,
        PortfolioDesign design,
        PortfolioContent content,
        String avatarPath,
        PortfolioPublishing publishing,
        Instant createdAt,
        Instant updatedAt
) {
}
