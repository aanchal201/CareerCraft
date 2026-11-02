package com.careercraft.service.resume;

import com.careercraft.dto.resume.ResumeCertification;
import com.careercraft.dto.resume.ResumeContent;
import com.careercraft.dto.resume.ResumeEducation;
import com.careercraft.dto.resume.ResumeExperience;
import com.careercraft.dto.resume.ResumePersonal;
import com.careercraft.dto.resume.ResumeSkill;
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
 * Builds the starting content of a new resume.
 *
 * fromProfile() copies the user's profile into the resume. From then on the
 * resume is independent: editing it never changes the profile (and vice versa),
 * so users can tailor each resume to a specific job.
 */
@Component
public class ResumeContentFactory {

    private static final Comparator<LocalDate> NEWEST_FIRST = Comparator.nullsLast(Comparator.reverseOrder());

    /** Only the name and email, everything else empty. */
    public ResumeContent blank(User user) {
        ResumePersonal personal = new ResumePersonal(user.getFullName(), null, user.getEmail(),
                null, null, null, null, null);
        ResumeContent empty = ResumeContentNormalizer.emptyContent();
        return new ResumeContent(personal, null, empty.experience(), empty.education(), empty.skills(),
                empty.projects(), empty.certifications(), empty.achievements(), empty.languages(), empty.sections());
    }

    public ResumeContent fromProfile(Profile profile) {
        User user = profile.getUser();

        ResumePersonal personal = new ResumePersonal(
                user.getFullName(),
                profile.getHeadline(),
                user.getEmail(),
                profile.getPhone(),
                profile.getLocation(),
                profile.getWebsiteUrl(),
                profile.getLinkedinUrl(),
                profile.getGithubUrl()
        );

        List<ResumeExperience> experience = profile.getExperiences().stream()
                .sorted(Comparator.comparing((Experience e) -> !e.isCurrentlyWorking())
                        .thenComparing(Experience::getStartDate, NEWEST_FIRST))
                .map(e -> new ResumeExperience(ResumeContentNormalizer.newId(), e.getJobTitle(), e.getCompany(),
                        e.getLocation(), month(e.getStartDate()), month(e.getEndDate()), e.isCurrentlyWorking(),
                        e.getDescription()))
                .toList();

        List<ResumeEducation> education = profile.getEducation().stream()
                .sorted(Comparator.comparing((Education e) -> !e.isCurrentlyStudying())
                        .thenComparing(Education::getStartDate, NEWEST_FIRST))
                .map(e -> new ResumeEducation(ResumeContentNormalizer.newId(), e.getInstitution(), e.getDegree(),
                        e.getFieldOfStudy(), null, month(e.getStartDate()), month(e.getEndDate()),
                        e.isCurrentlyStudying(), e.getGrade(), e.getDescription()))
                .toList();

        List<ResumeSkill> skills = profile.getSkills().stream()
                .sorted(Comparator.comparing(Skill::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(s -> new ResumeSkill(ResumeContentNormalizer.newId(), s.getName(), s.getLevel().name()))
                .toList();

        List<ResumeCertification> certifications = profile.getCertifications().stream()
                .sorted(Comparator.comparing(Certification::getIssueDate, NEWEST_FIRST))
                .map(c -> new ResumeCertification(ResumeContentNormalizer.newId(), c.getName(), c.getIssuer(),
                        month(c.getIssueDate()), c.getCredentialUrl()))
                .toList();

        return new ResumeContent(personal, profile.getAbout(), experience, education, skills, List.of(),
                certifications, List.of(), List.of(), ResumeContentNormalizer.defaultSections());
    }

    /** LocalDate -> "YYYY-MM" (the resume works with month precision). */
    private static String month(LocalDate date) {
        return date == null ? null : date.toString().substring(0, 7);
    }
}
