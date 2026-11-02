package com.careercraft.dto.request;

import com.careercraft.entity.SkillLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * One skill inside {@link SkillsUpdateRequest}.
 */
public record SkillRequest(

        @NotBlank(message = "Skill name is required")
        @Size(max = 60, message = "Skill name must be at most 60 characters")
        String name,

        @NotNull(message = "Skill level is required")
        SkillLevel level
) {
}
