package com.careercraft.dto.resume;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** level: BEGINNER | INTERMEDIATE | ADVANCED | EXPERT, or empty to hide the level. */
public record ResumeSkill(
        @Size(max = 40) String id,
        @Size(max = 60) String name,
        @Pattern(regexp = "^$|^(BEGINNER|INTERMEDIATE|ADVANCED|EXPERT)$", message = "Invalid skill level") String level
) {
}
