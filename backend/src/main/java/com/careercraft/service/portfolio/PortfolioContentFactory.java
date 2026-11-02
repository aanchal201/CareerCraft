package com.careercraft.service.portfolio;

import com.careercraft.dto.portfolio.PortfolioContent;
import com.careercraft.dto.portfolio.PortfolioContent.About;
import com.careercraft.dto.portfolio.PortfolioContent.Certification;
import com.careercraft.dto.portfolio.PortfolioContent.Contact;
import com.careercraft.dto.portfolio.PortfolioContent.Education;
import com.careercraft.dto.portfolio.PortfolioContent.Experience;
import com.careercraft.dto.portfolio.PortfolioContent.Hero;
import com.careercraft.dto.portfolio.PortfolioContent.Skill;
import com.careercraft.entity.Profile;
import com.careercraft.entity.User;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/**
 * Builds the starting content of a new portfolio - either just the name and
 * email, or a copy of the user's profile. After creation the portfolio is
 * independent of the profile.
 */
@Component
public class PortfolioContentFactory {

    private static final Comparator<LocalDate> NEWEST_FIRST = Comparator.nullsLast(Comparator.reverseOrder());

    public PortfolioContent blank(User user) {
        PortfolioContent empty = PortfolioNormalizer.emptyContent();
        return new PortfolioContent(
                new Hero(user.getFullName(), null, null, null, "Get in touch", true),
                empty.about(), List.of(), List.of(), List.of(), List.of(), List.of(),
                new Contact(null, user.getEmail(), null, null, null, null),
                empty.sections());
    }

    public PortfolioContent fromProfile(Profile profile) {
        User user = profile.getUser();

        Hero hero = new Hero(user.getFullName(), profile.getHeadline(), null, null, "Get in touch", true);
        About about = new About(profile.getAbout(), profile.getLocation());

        List<Skill> skills = profile.getSkills().stream()
                .sorted(Comparator.comparing(s -> s.getId() == null ? Long.MAX_VALUE : s.getId()))
                .map(s -> new Skill(PortfolioNormalizer.newId(), s.getName(), null))
                .toList();

        List<Experience> experience = profile.getExperiences().stream()
                .sorted(Comparator.comparing((com.careercraft.entity.Experience e) -> !e.isCurrentlyWorking())
                        .thenComparing(com.careercraft.entity.Experience::getStartDate, NEWEST_FIRST))
                .map(e -> new Experience(PortfolioNormalizer.newId(), e.getJobTitle(), e.getCompany(),
                        e.getLocation(), month(e.getStartDate()), month(e.getEndDate()), e.isCurrentlyWorking(),
                        e.getDescription()))
                .toList();

        List<Education> education = profile.getEducation().stream()
                .sorted(Comparator.comparing((com.careercraft.entity.Education e) -> !e.isCurrentlyStudying())
                        .thenComparing(com.careercraft.entity.Education::getStartDate, NEWEST_FIRST))
                .map(e -> new Education(PortfolioNormalizer.newId(), e.getInstitution(), e.getDegree(),
                        e.getFieldOfStudy(), month(e.getStartDate()), month(e.getEndDate()), e.isCurrentlyStudying(),
                        e.getDescription()))
                .toList();

        List<Certification> certifications = profile.getCertifications().stream()
                .sorted(Comparator.comparing(com.careercraft.entity.Certification::getIssueDate, NEWEST_FIRST))
                .map(c -> new Certification(PortfolioNormalizer.newId(), c.getName(), c.getIssuer(),
                        month(c.getIssueDate()), c.getCredentialUrl()))
                .toList();

        Contact contact = new Contact(null, user.getEmail(), profile.getPhone(), profile.getLinkedinUrl(),
                profile.getGithubUrl(), profile.getWebsiteUrl());

        return new PortfolioContent(hero, about, skills, List.of(), experience, education, certifications, contact,
                PortfolioNormalizer.defaultSections());
    }

    private static String month(LocalDate date) {
        return date == null ? null : date.toString().substring(0, 7);
    }
}
