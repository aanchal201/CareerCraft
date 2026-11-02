package com.careercraft.dto.portfolio;

/**
 * The frozen, public version of a portfolio (stored as JSON in
 * portfolios.published_snapshot when the user publishes).
 */
public record PortfolioSnapshot(
        String templateId,
        PortfolioDesign design,
        PortfolioContent content
) {
}
