package com.careercraft.dto.response;

import java.time.Instant;
import java.util.List;

/**
 * The complete profile. Returned by GET /api/profile and by EVERY profile
 * mutation, so the frontend always has one consistent, up-to-date copy
 * (including the recalculated completion percentage).
 */
public record ProfileResponse(
        PersonalInfoResponse personal,
        List<EducationResponse> education,
        List<ExperienceResponse> experience,
        List<SkillResponse> skills,
        List<CertificationResponse> certifications,
        ProfileCompletionResponse completion,
        Instant updatedAt
) {
}
