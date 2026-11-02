package com.careercraft.dto.response;

import java.time.LocalDate;

public record EducationResponse(
        Long id,
        String institution,
        String degree,
        String fieldOfStudy,
        LocalDate startDate,
        LocalDate endDate,
        boolean currentlyStudying,
        String grade,
        String description
) {
}
