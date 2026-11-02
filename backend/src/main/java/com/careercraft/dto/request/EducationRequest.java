package com.careercraft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Body of POST/PUT /api/profile/education. Dates use ISO format: "2022-07-01".
 */
public record EducationRequest(

        @NotBlank(message = "Institution is required")
        @Size(max = 150, message = "Institution must be at most 150 characters")
        String institution,

        @NotBlank(message = "Degree is required")
        @Size(max = 120, message = "Degree must be at most 120 characters")
        String degree,

        @Size(max = 120, message = "Field of study must be at most 120 characters")
        String fieldOfStudy,

        @NotNull(message = "Start date is required")
        LocalDate startDate,

        LocalDate endDate,

        boolean currentlyStudying,

        @Size(max = 30, message = "Grade must be at most 30 characters")
        String grade,

        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description
) {
}
