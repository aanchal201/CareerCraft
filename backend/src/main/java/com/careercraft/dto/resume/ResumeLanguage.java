package com.careercraft.dto.resume;

import jakarta.validation.constraints.Size;

/** proficiency: free text such as "Native", "Fluent", "Professional", "Basic". */
public record ResumeLanguage(
        @Size(max = 40) String id,
        @Size(max = 60) String name,
        @Size(max = 40) String proficiency
) {
}
