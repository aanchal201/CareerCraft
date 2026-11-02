package com.careercraft.dto.resume;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResumeCertification(
        @Size(max = 40) String id,
        @Size(max = 150) String name,
        @Size(max = 150) String issuer,
        @Pattern(regexp = ResumeFormats.MONTH, message = ResumeFormats.MONTH_MESSAGE) String date,
        @Size(max = 255) @Pattern(regexp = ResumeFormats.URL, message = ResumeFormats.URL_MESSAGE) String link
) {
}
