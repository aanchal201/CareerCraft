package com.careercraft.dto.resume;

import jakarta.validation.constraints.Size;

/**
 * Order / visibility / heading of one resume section.
 *
 * @param key     summary | experience | education | projects | skills | certifications | achievements | languages
 * @param title   heading shown on the resume (user can rename it)
 * @param visible false = section is "removed" from the resume (its data is kept)
 */
public record ResumeSection(
        @Size(max = 30) String key,
        @Size(max = 60) String title,
        boolean visible
) {
}
