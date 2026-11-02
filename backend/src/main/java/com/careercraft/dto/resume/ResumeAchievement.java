package com.careercraft.dto.resume;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResumeAchievement(
        @Size(max = 40) String id,
        @Size(max = 150) String title,
        @Pattern(regexp = ResumeFormats.MONTH, message = ResumeFormats.MONTH_MESSAGE) String date,
        @Size(max = 1000) String description
) {
}
