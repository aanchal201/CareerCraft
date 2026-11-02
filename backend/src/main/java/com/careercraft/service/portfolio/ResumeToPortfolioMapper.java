package com.careercraft.service.portfolio;

import com.careercraft.dto.portfolio.PortfolioContent;
import com.careercraft.dto.portfolio.PortfolioContent.About;
import com.careercraft.dto.portfolio.PortfolioContent.Certification;
import com.careercraft.dto.portfolio.PortfolioContent.Contact;
import com.careercraft.dto.portfolio.PortfolioContent.Education;
import com.careercraft.dto.portfolio.PortfolioContent.Experience;
import com.careercraft.dto.portfolio.PortfolioContent.Hero;
import com.careercraft.dto.portfolio.PortfolioContent.Project;
import com.careercraft.dto.portfolio.PortfolioContent.Skill;
import com.careercraft.dto.resume.ResumeContent;
import com.careercraft.dto.resume.ResumePersonal;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.stream.IntStream;

/**
 * Turns a saved resume into portfolio content - no AI involved. Every field
 * comes straight from the resume, so nothing is invented.
 *
 * Project links: GitHub/GitLab/Bitbucket links become "Source code",
 * anything else becomes "Live demo". The first project is featured.
 */
@Component
public class ResumeToPortfolioMapper {

    public PortfolioContent map(ResumeContent resume) {
        ResumePersonal p = resume.personal();

        Hero hero = new Hero(p.fullName(), p.jobTitle(), null, null, "Get in touch", true);
        About about = new About(resume.summary(), p.location());

        List<Skill> skills = resume.skills().stream()
                .filter(s -> hasText(s.name()))
                .map(s -> new Skill(PortfolioNormalizer.newId(), s.name().trim(), null))
                .toList();

        List<Project> projects = IntStream.range(0, resume.projects().size())
                .mapToObj(i -> {
                    var pr = resume.projects().get(i);
                    boolean isRepo = isCodeHost(pr.link());
                    String description = joinNonBlank(pr.role(), pr.description());
                    return new Project(PortfolioNormalizer.newId(), pr.name(), description, pr.technologies(),
                            isRepo ? null : pr.link(), isRepo ? pr.link() : null, null, i == 0);
                })
                .filter(pr -> hasText(pr.name()))
                .toList();

        List<Experience> experience = resume.experience().stream()
                .map(e -> new Experience(PortfolioNormalizer.newId(), e.jobTitle(), e.company(), e.location(),
                        e.startDate(), e.endDate(), e.current(), e.description()))
                .toList();

        List<Education> education = resume.education().stream()
                .map(e -> new Education(PortfolioNormalizer.newId(), e.institution(), e.degree(), e.fieldOfStudy(),
                        e.startDate(), e.endDate(), e.current(),
                        joinNonBlank(hasText(e.grade()) ? "Grade: " + e.grade() : null, e.description())))
                .toList();

        List<Certification> certifications = resume.certifications().stream()
                .map(c -> new Certification(PortfolioNormalizer.newId(), c.name(), c.issuer(), c.date(), c.link()))
                .toList();

        Contact contact = new Contact(null, p.email(), p.phone(), p.linkedin(), p.github(), p.website());

        return new PortfolioContent(hero, about, skills, projects, experience, education, certifications, contact,
                PortfolioNormalizer.defaultSections());
    }

    static boolean isCodeHost(String url) {
        if (!hasText(url)) return false;
        String lower = url.toLowerCase(Locale.ROOT);
        return lower.contains("github.com") || lower.contains("gitlab.com") || lower.contains("bitbucket.org");
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String joinNonBlank(String first, String second) {
        if (!hasText(first)) return second;
        if (!hasText(second)) return first.trim();
        return first.trim() + "\n" + second.trim();
    }
}
