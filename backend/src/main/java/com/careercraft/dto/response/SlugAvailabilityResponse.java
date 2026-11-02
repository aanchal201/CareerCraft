package com.careercraft.dto.response;

/**
 * Result of checking a portfolio address.
 *
 * @param slug      the normalized slug that was checked
 * @param available true if this portfolio can use it
 * @param message   why not (or a confirmation)
 */
public record SlugAvailabilityResponse(String slug, boolean available, String message) {
}
