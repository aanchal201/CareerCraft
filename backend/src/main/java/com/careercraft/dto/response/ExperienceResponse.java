package com.careercraft.dto.response;

import java.time.LocalDate;

public record ExperienceResponse(
        Long id,
        String jobTitle,
        String company,
        String employmentType,
        String location,
        LocalDate startDate,
        LocalDate endDate,
        boolean currentlyWorking,
        String description
) {
}
