package com.careercraft.dto.resume;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResumeEducation(
        @Size(max = 40) String id,
        @Size(max = 150) String institution,
        @Size(max = 120) String degree,
        @Size(max = 120) String fieldOfStudy,
        @Size(max = 100) String location,
        @Pattern(regexp = ResumeFormats.MONTH, message = ResumeFormats.MONTH_MESSAGE) String startDate,
        @Pattern(regexp = ResumeFormats.MONTH, message = ResumeFormats.MONTH_MESSAGE) String endDate,
        boolean current,
        @Size(max = 30) String grade,
        @Size(max = 1500) String description
) {
}
