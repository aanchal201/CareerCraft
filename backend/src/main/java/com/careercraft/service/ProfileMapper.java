package com.careercraft.service;

import com.careercraft.dto.response.CertificationResponse;
import com.careercraft.dto.response.EducationResponse;
import com.careercraft.dto.response.ExperienceResponse;
import com.careercraft.dto.response.PersonalInfoResponse;
import com.careercraft.dto.response.ProfileResponse;
import com.careercraft.dto.response.SkillResponse;
import com.careercraft.entity.Certification;
import com.careercraft.entity.Education;
import com.careercraft.entity.Experience;
import com.careercraft.entity.Profile;
import com.careercraft.entity.Skill;
import com.careercraft.entity.User;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/**
 * Converts Profile entities into response DTOs and sorts the lists the way
 * a resume reads: newest first, current roles at the top.
 */
@Component
public class ProfileMapper {

    private static final Comparator<LocalDate> NEWEST_FIRST =
            Comparator.nullsLast(Comparator.reverseOrder());

    private final ProfileCompletionCalculator completionCalculator;

    public ProfileMapper(ProfileCompletionCalculator completionCalculator) {
        this.completionCalculator = completionCalculator;
    }

    /**
     * @param avatarPath null when the user has no profile picture
     */
    public ProfileResponse toResponse(Profile profile, String avatarPath) {
        User user = profile.getUser();

        PersonalInfoResponse personal = new PersonalInfoResponse(
                user.getFullName(),
                user.getEmail(),
                profile.getHeadline(),
                profile.getPhone(),
                profile.getLocation(),
                profile.getAbout(),
                profile.getWebsiteUrl(),
                profile.getLinkedinUrl(),
                profile.getGithubUrl(),
                avatarPath
        );

        List<EducationResponse> education = profile.getEducation().stream()
                .sorted(Comparator.comparing((Education e) -> !e.isCurrentlyStudying())
                        .thenComparing(Education::getStartDate, NEWEST_FIRST))
                .map(this::toResponse)
                .toList();

        List<ExperienceResponse> experience = profile.getExperiences().stream()
                .sorted(Comparator.comparing((Experience e) -> !e.isCurrentlyWorking())
                        .thenComparing(Experience::getStartDate, NEWEST_FIRST))
                .map(this::toResponse)
                .toList();

        List<SkillResponse> skills = profile.getSkills().stream()
                .sorted(Comparator.comparing(Skill::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(skill -> new SkillResponse(skill.getId(), skill.getName(), skill.getLevel().name()))
                .toList();

        List<CertificationResponse> certifications = profile.getCertifications().stream()
                .sorted(Comparator.comparing(Certification::getIssueDate, NEWEST_FIRST))
                .map(this::toResponse)
                .toList();

        return new ProfileResponse(
                personal,
                education,
                experience,
                skills,
                certifications,
                completionCalculator.calculate(profile, avatarPath != null),
                profile.getUpdatedAt()
        );
    }

    private EducationResponse toResponse(Education e) {
        return new EducationResponse(e.getId(), e.getInstitution(), e.getDegree(), e.getFieldOfStudy(),
                e.getStartDate(), e.getEndDate(), e.isCurrentlyStudying(), e.getGrade(), e.getDescription());
    }

    private ExperienceResponse toResponse(Experience e) {
        return new ExperienceResponse(e.getId(), e.getJobTitle(), e.getCompany(), e.getEmploymentType(),
                e.getLocation(), e.getStartDate(), e.getEndDate(), e.isCurrentlyWorking(), e.getDescription());
    }

    private CertificationResponse toResponse(Certification c) {
        return new CertificationResponse(c.getId(), c.getName(), c.getIssuer(), c.getIssueDate(),
                c.getExpiryDate(), c.getCredentialId(), c.getCredentialUrl());
    }
}
