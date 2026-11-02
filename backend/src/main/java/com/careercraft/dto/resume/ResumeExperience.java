package com.careercraft.dto.resume;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResumeExperience(
        @Size(max = 40) String id,
        @Size(max = 120) String jobTitle,
        @Size(max = 150) String company,
        @Size(max = 100) String location,
        @Pattern(regexp = ResumeFormats.MONTH, message = ResumeFormats.MONTH_MESSAGE) String startDate,
        @Pattern(regexp = ResumeFormats.MONTH, message = ResumeFormats.MONTH_MESSAGE) String endDate,
        boolean current,
        @Size(max = 3000) String description
) {
}
