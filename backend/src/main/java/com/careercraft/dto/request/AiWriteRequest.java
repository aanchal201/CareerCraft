package com.careercraft.dto.request;

import jakarta.validation.constraints.Pattern;

/** Body of POST /api/portfolios/{id}/ai/write. */
public record AiWriteRequest(
        @Pattern(regexp = "^$|^(PROFESSIONAL|FRIENDLY|BOLD)$", message = "Tone must be PROFESSIONAL, FRIENDLY or BOLD")
        String tone
) {
}
