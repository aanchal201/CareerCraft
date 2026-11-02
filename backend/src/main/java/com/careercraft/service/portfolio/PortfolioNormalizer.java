package com.careercraft.service.portfolio;

import com.careercraft.dto.portfolio.PortfolioContent;
import com.careercraft.dto.portfolio.PortfolioContent.About;
import com.careercraft.dto.portfolio.PortfolioContent.Certification;
import com.careercraft.dto.portfolio.PortfolioContent.Contact;
import com.careercraft.dto.portfolio.PortfolioContent.Education;
import com.careercraft.dto.portfolio.PortfolioContent.Experience;
import com.careercraft.dto.portfolio.PortfolioContent.Hero;
import com.careercraft.dto.portfolio.PortfolioContent.Project;
import com.careercraft.dto.portfolio.PortfolioContent.Section;
import com.careercraft.dto.portfolio.PortfolioContent.Skill;
import com.careercraft.dto.portfolio.PortfolioDesign;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;

import static com.careercraft.util.TextUtils.clean;

/**
 * Brings portfolio content and design into a predictable shape on every save
 * and load (same idea as ResumeContentNormalizer):
 *  - nulls become empty objects/lists, list items get ids
 *  - all 7 section keys exist exactly once (user order kept)
 *  - design values outside the allowed set fall back to defaults
 */
@Component
public class PortfolioNormalizer {

    public static final Map<String, String> DEFAULT_SECTIONS;
    private static final List<String> ORDER;

    static {
        Map<String, String> sections = new LinkedHashMap<>();
        sections.put("about", "About Me");
        sections.put("skills", "Skills");
        sections.put("projects", "Projects");
        sections.put("experience", "Experience");
        sections.put("education", "Education");
        sections.put("certifications", "Certifications");
        sections.put("contact", "Get in Touch");
        DEFAULT_SECTIONS = Map.copyOf(sections);
        ORDER = List.copyOf(sections.keySet());
    }

    public static final String DEFAULT_COLOR = "#0f766e";

    // ------------------------------------------------------------------ design

    public PortfolioDesign normalizeDesign(PortfolioDesign d) {
        PortfolioDesign in = d != null ? d : new PortfolioDesign(null, null, null, null, null);
        return new PortfolioDesign(
                in.primaryColor() != null && in.primaryColor().matches("^#[0-9a-fA-F]{6}$")
                        ? in.primaryColor().toLowerCase(Locale.ROOT) : DEFAULT_COLOR,
                oneOf(in.colorMode(), Set.of("LIGHT", "DARK"), "LIGHT"),
                oneOf(in.fontPairing(), Set.of("modern", "editorial", "tech", "friendly"), "modern"),
                oneOf(in.heroAlign(), Set.of("LEFT", "CENTER"), "LEFT"),
                oneOf(in.projectLayout(), Set.of("GRID", "LIST"), "GRID")
        );
    }

    public static PortfolioDesign defaultDesign() {
        return new PortfolioDesign(DEFAULT_COLOR, "LIGHT", "modern", "LEFT", "GRID");
    }

    // ------------------------------------------------------------------ content

    public PortfolioContent normalizeContent(PortfolioContent input) {
        PortfolioContent c = input != null ? input : emptyContent();
        Hero hero = c.hero() != null ? c.hero() : emptyHero();
        return new PortfolioContent(
                new Hero(hero.name(), hero.headline(), hero.tagline(), hero.availability(),
                        clean(hero.ctaLabel()) != null ? hero.ctaLabel().trim() : "Get in touch", hero.showAvatar()),
                c.about() != null ? c.about() : new About(null, null),
                withIds(c.skills(), Skill::id, s -> new Skill(newId(), s.name(), s.category())),
                withIds(c.projects(), Project::id, p -> new Project(newId(), p.name(), p.description(),
                        p.technologies(), p.liveUrl(), p.repoUrl(), p.imageUrl(), p.featured())),
                withIds(c.experience(), Experience::id, e -> new Experience(newId(), e.jobTitle(), e.company(),
                        e.location(), e.startDate(), e.endDate(), e.current(), e.description())),
                withIds(c.education(), Education::id, e -> new Education(newId(), e.institution(), e.degree(),
                        e.fieldOfStudy(), e.startDate(), e.endDate(), e.current(), e.description())),
                withIds(c.certifications(), Certification::id, x -> new Certification(newId(), x.name(),
                        x.issuer(), x.date(), x.link())),
                c.contact() != null ? c.contact() : new Contact(null, null, null, null, null, null),
                normalizeSections(c.sections())
        );
    }

    public static PortfolioContent emptyContent() {
        return new PortfolioContent(emptyHero(), new About(null, null), List.of(), List.of(), List.of(), List.of(),
                List.of(), new Contact(null, null, null, null, null, null), defaultSections());
    }

    static Hero emptyHero() {
        return new Hero(null, null, null, null, "Get in touch", true);
    }

    public static List<Section> defaultSections() {
        return ORDER.stream().map(key -> new Section(key, DEFAULT_SECTIONS.get(key), true)).toList();
    }

    private List<Section> normalizeSections(List<Section> incoming) {
        List<Section> result = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        if (incoming != null) {
            for (Section section : incoming) {
                if (section == null || section.key() == null) continue;
                String key = section.key().trim();
                if (!DEFAULT_SECTIONS.containsKey(key) || !seen.add(key)) continue;
                String title = clean(section.title());
                result.add(new Section(key, title != null ? title : DEFAULT_SECTIONS.get(key), section.visible()));
            }
        }
        for (String key : ORDER) {
            if (seen.add(key)) result.add(new Section(key, DEFAULT_SECTIONS.get(key), true));
        }
        return result;
    }

    private static <T> List<T> withIds(List<T> items, Function<T, String> idGetter, Function<T, T> withNewId) {
        if (items == null) return List.of();
        List<T> result = new ArrayList<>();
        Set<String> used = new HashSet<>();
        for (T item : items) {
            if (item == null) continue;
            String id = idGetter.apply(item);
            boolean needsId = id == null || id.isBlank() || !used.add(id);
            T normalized = needsId ? withNewId.apply(item) : item;
            if (needsId) used.add(idGetter.apply(normalized));
            result.add(normalized);
        }
        return result;
    }

    private static String oneOf(String value, Set<String> allowed, String fallback) {
        return value != null && allowed.contains(value.trim()) ? value.trim() : fallback;
    }

    static String newId() {
        return UUID.randomUUID().toString();
    }
}
