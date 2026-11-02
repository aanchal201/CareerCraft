package com.careercraft.service.analysis;

import com.careercraft.dto.resume.ResumeAchievement;
import com.careercraft.dto.resume.ResumeCertification;
import com.careercraft.dto.resume.ResumeContent;
import com.careercraft.dto.resume.ResumeEducation;
import com.careercraft.dto.resume.ResumeExperience;
import com.careercraft.dto.resume.ResumeLanguage;
import com.careercraft.dto.resume.ResumePersonal;
import com.careercraft.dto.resume.ResumeProject;
import com.careercraft.dto.resume.ResumeSection;
import com.careercraft.dto.resume.ResumeSkill;
import org.springframework.stereotype.Component;

import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Turns a saved CareerCraft resume into plain text - roughly what an ATS
 * would read from its PDF - so it can be analyzed like an uploaded file.
 * Only visible sections are included, in the user's order.
 */
@Component
public class ResumePlainTextRenderer {

    public String render(ResumeContent content) {
        StringBuilder out = new StringBuilder();
        ResumePersonal p = content.personal();

        line(out, p.fullName());
        line(out, p.jobTitle());
        line(out, joinNonBlank(" | ", p.email(), p.phone(), p.location(), p.linkedin(), p.github(), p.website()));

        for (ResumeSection section : content.sections()) {
            if (!section.visible()) continue;
            String body = renderSection(section.key(), content);
            if (body.isBlank()) continue;
            out.append('\n').append(section.title().toUpperCase(Locale.ROOT)).append('\n').append(body);
        }
        return out.toString().trim();
    }

    private String renderSection(String key, ResumeContent c) {
        StringBuilder s = new StringBuilder();
        switch (key) {
            case "summary" -> line(s, c.summary());
            case "experience" -> {
                for (ResumeExperience e : c.experience()) {
                    line(s, joinNonBlank(" - ", e.jobTitle(), e.company()));
                    line(s, joinNonBlank(" | ", range(e.startDate(), e.endDate(), e.current()), e.location()));
                    bullets(s, e.description());
                }
            }
            case "education" -> {
                for (ResumeEducation e : c.education()) {
                    line(s, joinNonBlank(", ", e.degree(), e.fieldOfStudy()));
                    line(s, joinNonBlank(" | ", e.institution(), range(e.startDate(), e.endDate(), e.current()),
                            e.location(), e.grade()));
                    bullets(s, e.description());
                }
            }
            case "projects" -> {
                for (ResumeProject pr : c.projects()) {
                    line(s, joinNonBlank(" - ", pr.name(), pr.role()));
                    line(s, joinNonBlank(" | ", pr.technologies(), range(pr.startDate(), pr.endDate(), false), pr.link()));
                    bullets(s, pr.description());
                }
            }
            case "skills" -> line(s, c.skills().stream().map(ResumeSkill::name)
                    .filter(this::hasText).collect(Collectors.joining(", ")));
            case "certifications" -> {
                for (ResumeCertification x : c.certifications()) {
                    line(s, joinNonBlank(" - ", x.name(), x.issuer(), month(x.date())));
                }
            }
            case "achievements" -> {
                for (ResumeAchievement a : c.achievements()) {
                    line(s, joinNonBlank(" - ", a.title(), month(a.date())));
                    bullets(s, a.description());
                }
            }
            case "languages" -> line(s, c.languages().stream()
                    .filter(l -> hasText(l.name()))
                    .map(l -> hasText(l.proficiency()) ? l.name() + " (" + l.proficiency() + ")" : l.name())
                    .collect(Collectors.joining(", ")));
            default -> {
                // unknown section keys are ignored
            }
        }
        return s.toString();
    }

    private void bullets(StringBuilder s, String description) {
        if (!hasText(description)) return;
        for (String raw : description.split("\n")) {
            String text = raw.replaceFirst("^\\s*[•\\-*]\\s*", "").trim();
            if (!text.isEmpty()) s.append("• ").append(text).append('\n');
        }
    }

    private void line(StringBuilder s, String text) {
        if (hasText(text)) s.append(text.trim()).append('\n');
    }

    private boolean hasText(String text) {
        return text != null && !text.isBlank();
    }

    private String joinNonBlank(String separator, String... parts) {
        return Stream.of(parts).filter(Objects::nonNull).map(String::trim).filter(part -> !part.isEmpty())
                .collect(Collectors.joining(separator));
    }

    /** "2024-06" -> "Jun 2024" */
    private String month(String yearMonth) {
        if (!hasText(yearMonth) || yearMonth.length() < 7) return yearMonth;
        try {
            Month m = Month.of(Integer.parseInt(yearMonth.substring(5, 7)));
            return m.getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + yearMonth.substring(0, 4);
        } catch (RuntimeException ex) {
            return yearMonth;
        }
    }

    private String range(String start, String end, boolean current) {
        List<String> parts = new ArrayList<>();
        if (hasText(start)) parts.add(month(start));
        if (current) parts.add("Present");
        else if (hasText(end)) parts.add(month(end));
        return String.join(" - ", parts);
    }
}
