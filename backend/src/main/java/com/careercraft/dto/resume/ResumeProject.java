package com.careercraft.dto.resume;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResumeProject(
        @Size(max = 40) String id,
        @Size(max = 120) String name,
        @Size(max = 120) String role,
        @Size(max = 200) String technologies,
        @Size(max = 255) @Pattern(regexp = ResumeFormats.URL, message = ResumeFormats.URL_MESSAGE) String link,
        @Pattern(regexp = ResumeFormats.MONTH, message = ResumeFormats.MONTH_MESSAGE) String startDate,
        @Pattern(regexp = ResumeFormats.MONTH, message = ResumeFormats.MONTH_MESSAGE) String endDate,
        @Size(max = 2000) String description
) {
}
