package com.careercraft.dto.resume;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** The resume header. All fields optional so a resume can be saved while it is being written. */
public record ResumePersonal(
        @Size(max = 100) String fullName,
        @Size(max = 120) String jobTitle,
        @Size(max = 150) String email,
        @Size(max = 30) String phone,
        @Size(max = 100) String location,
        @Size(max = 255) @Pattern(regexp = ResumeFormats.URL, message = ResumeFormats.URL_MESSAGE) String website,
        @Size(max = 255) @Pattern(regexp = ResumeFormats.URL, message = ResumeFormats.URL_MESSAGE) String linkedin,
        @Size(max = 255) @Pattern(regexp = ResumeFormats.URL, message = ResumeFormats.URL_MESSAGE) String github
) {
    public static ResumePersonal empty() {
        return new ResumePersonal(null, null, null, null, null, null, null, null);
    }
}
