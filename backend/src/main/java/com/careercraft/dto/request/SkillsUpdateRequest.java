package com.careercraft.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Body of PUT /api/profile/skills. Replaces the whole skill list at once,
 * which keeps the API simple for a tag-style editor.
 */
public record SkillsUpdateRequest(

        @NotNull(message = "Skills list is required")
        @Size(max = 50, message = "You can add up to 50 skills")
        List<@Valid SkillRequest> skills
) {
}
