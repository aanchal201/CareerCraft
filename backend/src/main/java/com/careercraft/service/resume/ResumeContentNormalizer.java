package com.careercraft.service.resume;

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

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;

import static com.careercraft.util.TextUtils.clean;

/**
 * Brings any incoming resume content into a consistent shape before saving:
 *  - null objects/lists become empty ones
 *  - every list item gets an id (used as a React key on the frontend)
 *  - sections: unknown keys and duplicates are dropped, missing ones are
 *    appended with defaults, blank titles get the default title
 *
 * This means the frontend (and future AI features) can always rely on all
 * eight sections being present exactly once.
 */
@Component
public class ResumeContentNormalizer {

    /** Default headings, keyed by section key. */
    public static final Map<String, String> DEFAULT_SECTIONS;

    /** Default section order. */
    private static final List<String> ORDER;

    static {
        Map<String, String> sections = new LinkedHashMap<>();
        sections.put("summary", "Professional Summary");
        sections.put("experience", "Work Experience");
        sections.put("projects", "Projects");
        sections.put("education", "Education");
        sections.put("skills", "Skills");
        sections.put("certifications", "Certifications");
        sections.put("achievements", "Achievements");
        sections.put("languages", "Languages");
        DEFAULT_SECTIONS = Map.copyOf(sections);
        ORDER = List.copyOf(sections.keySet()); // LinkedHashMap keeps insertion order
    }

    public ResumeContent normalize(ResumeContent input) {
        ResumeContent c = input != null ? input : emptyContent();

        return new ResumeContent(
                c.personal() != null ? c.personal() : ResumePersonal.empty(),
                clean(c.summary()),
                withIds(c.experience(), ResumeExperience::id, e -> new ResumeExperience(newId(), e.jobTitle(),
                        e.company(), e.location(), e.startDate(), e.endDate(), e.current(), e.description())),
                withIds(c.education(), ResumeEducation::id, e -> new ResumeEducation(newId(), e.institution(),
                        e.degree(), e.fieldOfStudy(), e.location(), e.startDate(), e.endDate(), e.current(),
                        e.grade(), e.description())),
                withIds(c.skills(), ResumeSkill::id, s -> new ResumeSkill(newId(), s.name(), s.level())),
                withIds(c.projects(), ResumeProject::id, p -> new ResumeProject(newId(), p.name(), p.role(),
                        p.technologies(), p.link(), p.startDate(), p.endDate(), p.description())),
                withIds(c.certifications(), ResumeCertification::id, x -> new ResumeCertification(newId(),
                        x.name(), x.issuer(), x.date(), x.link())),
                withIds(c.achievements(), ResumeAchievement::id, a -> new ResumeAchievement(newId(), a.title(),
                        a.date(), a.description())),
                withIds(c.languages(), ResumeLanguage::id, l -> new ResumeLanguage(newId(), l.name(),
                        l.proficiency())),
                normalizeSections(c.sections())
        );
    }

    public static ResumeContent emptyContent() {
        return new ResumeContent(ResumePersonal.empty(), null, List.of(), List.of(), List.of(), List.of(),
                List.of(), List.of(), List.of(), defaultSections());
    }

    public static List<ResumeSection> defaultSections() {
        return ORDER.stream().map(key -> new ResumeSection(key, DEFAULT_SECTIONS.get(key), true)).toList();
    }

    private List<ResumeSection> normalizeSections(List<ResumeSection> incoming) {
        List<ResumeSection> result = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        if (incoming != null) {
            for (ResumeSection section : incoming) {
                if (section == null || section.key() == null) continue;
                String key = section.key().trim();
                if (!DEFAULT_SECTIONS.containsKey(key) || !seen.add(key)) continue;
                String title = clean(section.title());
                result.add(new ResumeSection(key, title != null ? title : DEFAULT_SECTIONS.get(key), section.visible()));
            }
        }
        for (String key : ORDER) {
            if (seen.add(key)) {
                result.add(new ResumeSection(key, DEFAULT_SECTIONS.get(key), true));
            }
        }
        return result;
    }

    /** Drops null items and gives items without an id a fresh one. */
    private static <T> List<T> withIds(List<T> items, Function<T, String> idGetter, Function<T, T> withNewId) {
        if (items == null) return List.of();
        List<T> result = new ArrayList<>();
        Set<String> usedIds = new HashSet<>();
        for (T item : items) {
            if (item == null) continue;
            String id = idGetter.apply(item);
            boolean needsId = id == null || id.isBlank() || !usedIds.add(id);
            T normalized = needsId ? withNewId.apply(item) : item;
            if (needsId) usedIds.add(idGetter.apply(normalized));
            result.add(normalized);
        }
        return result;
    }

    static String newId() {
        return UUID.randomUUID().toString();
    }
}
