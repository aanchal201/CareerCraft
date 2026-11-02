package com.careercraft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Body of POST/PUT /api/profile/experience.
 */
public record ExperienceRequest(

        @NotBlank(message = "Job title is required")
        @Size(max = 120, message = "Job title must be at most 120 characters")
        String jobTitle,

        @NotBlank(message = "Company is required")
        @Size(max = 150, message = "Company must be at most 150 characters")
        String company,

        @Size(max = 30, message = "Employment type must be at most 30 characters")
        String employmentType,

        @Size(max = 100, message = "Location must be at most 100 characters")
        String location,

        @NotNull(message = "Start date is required")
        LocalDate startDate,

        LocalDate endDate,

        boolean currentlyWorking,

        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description
) {
}
