package com.careercraft.service.portfolio;

import com.careercraft.ai.AiServiceException;
import com.careercraft.ai.AiUsageService;
import com.careercraft.ai.GrokClient;
import com.careercraft.dto.portfolio.PortfolioAiContent;
import com.careercraft.dto.portfolio.PortfolioContent;
import com.careercraft.dto.portfolio.PortfolioContent.About;
import com.careercraft.dto.portfolio.PortfolioContent.Contact;
import com.careercraft.dto.portfolio.PortfolioContent.Hero;
import com.careercraft.dto.portfolio.PortfolioContent.Project;
import com.careercraft.dto.portfolio.PortfolioContent.Skill;
import com.careercraft.dto.request.GeneratePortfolioRequest;
import com.careercraft.dto.response.PortfolioResponse;
import com.careercraft.dto.response.ResumeResponse;
import com.careercraft.service.analysis.ResumePlainTextRenderer;
import com.careercraft.service.resume.ResumeService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Phase 7 portfolio generation:
 *
 *  generate(): saved resume  ->  ResumeToPortfolioMapper (facts, no AI)
 *                            ->  optional PortfolioAiWriter (Grok writes intro, groups skills, polishes projects)
 *                            ->  new portfolio
 *
 *  writeWithAi(): existing portfolio -> AI suggestions the editor can apply (nothing is saved here)
 *
 * Not @Transactional on purpose: the AI call can take a while, so database
 * work happens in the short transactions of ResumeService / PortfolioService.
 */
@Service
public class PortfolioGenerationService {

    private final ResumeService resumeService;
    private final PortfolioService portfolioService;
    private final ResumeToPortfolioMapper mapper;
    private final ResumePlainTextRenderer plainTextRenderer;
    private final PortfolioAiWriter aiWriter;
    private final AiUsageService aiUsageService;
    private final GrokClient grokClient;

    public PortfolioGenerationService(ResumeService resumeService,
                                      PortfolioService portfolioService,
                                      ResumeToPortfolioMapper mapper,
                                      ResumePlainTextRenderer plainTextRenderer,
                                      PortfolioAiWriter aiWriter,
                                      AiUsageService aiUsageService,
                                      GrokClient grokClient) {
        this.resumeService = resumeService;
        this.portfolioService = portfolioService;
        this.mapper = mapper;
        this.plainTextRenderer = plainTextRenderer;
        this.aiWriter = aiWriter;
        this.aiUsageService = aiUsageService;
        this.grokClient = grokClient;
    }

    public PortfolioResponse generate(Long userId, GeneratePortfolioRequest request) {
        // cheap checks first, so nothing is spent on an invalid request
        PortfolioService.validTemplate(request.templateId());
        portfolioService.ensureCapacity(userId);
        if (request.useAi()) ensureAiAvailable(userId);

        ResumeResponse resume = resumeService.getResume(userId, request.resumeId()); // 404 if not the user's
        PortfolioContent content = mapper.map(resume.content());

        if (request.useAi()) {
            PortfolioAiContent ai = aiWriter.write(
                    plainTextRenderer.render(resume.content()),
                    request.tone(),
                    content.skills().stream().map(Skill::name).toList(),
                    content.projects().stream().map(Project::name).toList());
            aiUsageService.record(userId, AiUsageService.PORTFOLIO_GENERATE);
            content = merge(content, ai);
        }

        return portfolioService.createFromContent(userId, request.name(), request.templateId(), content);
    }

    /** Suggestions for an existing portfolio; the editor decides what to apply. */
    public PortfolioAiContent writeWithAi(Long userId, Long portfolioId, String tone) {
        PortfolioContent content = portfolioService.getContent(userId, portfolioId); // 404 if not the user's
        String description = PortfolioAiWriter.describe(content);
        if (description.length() < 40) {
            throw new com.careercraft.exception.InvalidRequestException(
                    "Add a few details first (name, a headline, some experience or projects) so the AI has something to work with.");
        }
        ensureAiAvailable(userId);

        PortfolioAiContent ai = aiWriter.write(description, tone,
                content.skills().stream().map(Skill::name).filter(n -> n != null && !n.isBlank()).toList(),
                content.projects().stream().map(Project::name).filter(n -> n != null && !n.isBlank()).toList());
        aiUsageService.record(userId, AiUsageService.PORTFOLIO_WRITE);
        return ai;
    }

    public Map<String, Object> aiStatus(Long userId) {
        long used = aiUsageService.usedToday(userId);
        return Map.of(
                "aiConfigured", grokClient.isConfigured(),
                "dailyLimit", aiUsageService.dailyLimit(),
                "remainingToday", Math.max(0, aiUsageService.dailyLimit() - used));
    }

    private void ensureAiAvailable(Long userId) {
        if (!grokClient.isConfigured()) throw AiServiceException.notConfigured();
        aiUsageService.ensurePortfolioQuota(userId);
    }

    /** Puts the AI-written copy into the fact-based content (empty AI values keep the original). */
    static PortfolioContent merge(PortfolioContent base, PortfolioAiContent ai) {
        Hero h = base.hero();
        Hero hero = new Hero(h.name(), pick(ai.headline(), h.headline()), pick(ai.tagline(), h.tagline()),
                h.availability(), h.ctaLabel(), h.showAvatar());
        About about = new About(pick(ai.about(), base.about().text()), base.about().location());
        Contact c = base.contact();
        Contact contact = new Contact(pick(ai.contactMessage(), c.message()), c.email(), c.phone(), c.linkedin(),
                c.github(), c.website());

        // skill -> category from the AI's groups
        Map<String, String> categoryBySkill = new HashMap<>();
        ai.skillGroups().forEach(group -> group.skills()
                .forEach(skill -> categoryBySkill.put(skill.toLowerCase(Locale.ROOT), group.category())));
        List<Skill> skills = new ArrayList<>();
        for (Skill s : base.skills()) {
            skills.add(new Skill(s.id(), s.name(), categoryBySkill.getOrDefault(s.name().toLowerCase(Locale.ROOT), s.category())));
        }

        Map<String, String> descriptionByProject = new HashMap<>();
        ai.projectDescriptions().forEach(d -> descriptionByProject.put(d.name().toLowerCase(Locale.ROOT), d.description()));
        List<Project> projects = base.projects().stream()
                .map(p -> new Project(p.id(), p.name(),
                        pick(descriptionByProject.get(p.name().toLowerCase(Locale.ROOT)), p.description()),
                        p.technologies(), p.liveUrl(), p.repoUrl(), p.imageUrl(), p.featured()))
                .toList();

        return new PortfolioContent(hero, about, skills, projects, base.experience(), base.education(),
                base.certifications(), contact, base.sections());
    }

    private static String pick(String preferred, String fallback) {
        return preferred != null && !preferred.isBlank() ? preferred : fallback;
    }
}
