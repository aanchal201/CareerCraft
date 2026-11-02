package com.careercraft.dto.portfolio;

import jakarta.validation.constraints.Pattern;

/**
 * Visual settings of a portfolio. Every field is optional on input -
 * missing values get defaults from PortfolioDesignNormalizer.
 *
 * @param primaryColor  accent color, "#rrggbb"
 * @param colorMode     LIGHT | DARK
 * @param fontPairing   modern | editorial | tech | friendly
 * @param heroAlign     LEFT | CENTER
 * @param projectLayout GRID | LIST
 */
public record PortfolioDesign(
        @Pattern(regexp = "^$|^#[0-9a-fA-F]{6}$", message = "Color must be a hex color like #0f766e")
        String primaryColor,

        @Pattern(regexp = "^$|^(LIGHT|DARK)$", message = "Color mode must be LIGHT or DARK")
        String colorMode,

        @Pattern(regexp = "^$|^(modern|editorial|tech|friendly)$", message = "Unknown font pairing")
        String fontPairing,

        @Pattern(regexp = "^$|^(LEFT|CENTER)$", message = "Hero alignment must be LEFT or CENTER")
        String heroAlign,

        @Pattern(regexp = "^$|^(GRID|LIST)$", message = "Project layout must be GRID or LIST")
        String projectLayout
) {
}
