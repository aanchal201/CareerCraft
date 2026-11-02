package com.careercraft.service.portfolio;

import com.careercraft.dto.portfolio.PortfolioContent;
import com.careercraft.dto.portfolio.PortfolioDesign;
import com.careercraft.dto.portfolio.PortfolioPublishing;
import com.careercraft.dto.portfolio.PortfolioSnapshot;
import com.careercraft.dto.request.CreatePortfolioRequest;
import com.careercraft.dto.request.UpdatePortfolioRequest;
import com.careercraft.dto.response.PortfolioResponse;
import com.careercraft.dto.response.PortfolioSummaryResponse;
import com.careercraft.dto.response.PublicPortfolioResponse;
import com.careercraft.dto.response.SlugAvailabilityResponse;
import com.careercraft.entity.Portfolio;
import com.careercraft.entity.User;
import com.careercraft.exception.ConflictException;
import com.careercraft.exception.InvalidRequestException;
import com.careercraft.exception.ResourceNotFoundException;
import com.careercraft.repository.PortfolioRepository;
import com.careercraft.repository.ProfileRepository;
import com.careercraft.repository.UserRepository;
import com.careercraft.service.ProfilePictureService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * Portfolio CRUD and publishing for the CURRENT user
 * (ownership enforced by findByIdAndUserId).
 */
@Service
public class PortfolioService {

    static final int MAX_PORTFOLIOS_PER_USER = 10;
    static final int MAX_CONTENT_CHARS = 500_000;

    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PortfolioContentFactory contentFactory;
    private final PortfolioNormalizer normalizer;
    private final ProfilePictureService pictureService;
    private final SlugPolicy slugPolicy;
    private final ObjectMapper objectMapper;

    public PortfolioService(PortfolioRepository portfolioRepository,
                            UserRepository userRepository,
                            ProfileRepository profileRepository,
                            PortfolioContentFactory contentFactory,
                            PortfolioNormalizer normalizer,
                            ProfilePictureService pictureService,
                            SlugPolicy slugPolicy,
                            ObjectMapper objectMapper) {
        this.portfolioRepository = portfolioRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.contentFactory = contentFactory;
        this.normalizer = normalizer;
        this.pictureService = pictureService;
        this.slugPolicy = slugPolicy;
        this.objectMapper = objectMapper;
    }

    // ------------------------------------------------------------------ CRUD

    @Transactional(readOnly = true)
    public List<PortfolioSummaryResponse> listPortfolios(Long userId) {
        return portfolioRepository.findAllByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(p -> {
                    PortfolioDesign design = normalizer.normalizeDesign(read(p.getDesign(), PortfolioDesign.class));
                    return new PortfolioSummaryResponse(p.getId(), p.getName(), p.getTemplateId(),
                            design.primaryColor(), design.colorMode(), p.getSlug(), p.isPublished(),
                            p.getCreatedAt(), p.getUpdatedAt());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public PortfolioResponse getPortfolio(Long userId, Long portfolioId) {
        return toResponse(findOwned(userId, portfolioId));
    }

    /** Loads the normalized draft content (used by AI features). */
    @Transactional(readOnly = true)
    public PortfolioContent getContent(Long userId, Long portfolioId) {
        return normalizer.normalizeContent(read(findOwned(userId, portfolioId).getContent(), PortfolioContent.class));
    }

    @Transactional
    public PortfolioResponse createPortfolio(Long userId, CreatePortfolioRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        PortfolioContent content = request.prefillFromProfile()
                ? profileRepository.findByUserId(userId).map(contentFactory::fromProfile)
                    .orElseGet(() -> contentFactory.blank(user))
                : contentFactory.blank(user);
        return createFromContent(userId, request.name(), request.templateId(), content);
    }

    /** Creates a portfolio with ready-made content (used by the resume-based generator). */
    @Transactional
    public PortfolioResponse createFromContent(Long userId, String name, String templateId, PortfolioContent content) {
        ensureCapacity(userId);
        String template = validTemplate(templateId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Portfolio portfolio = new Portfolio(user, name.trim(), template,
                write(PortfolioNormalizer.defaultDesign()), write(normalizer.normalizeContent(content)));
        return toResponse(portfolioRepository.saveAndFlush(portfolio));
    }

    @Transactional
    public PortfolioResponse updatePortfolio(Long userId, Long portfolioId, UpdatePortfolioRequest request) {
        Portfolio portfolio = findOwned(userId, portfolioId);
        portfolio.setName(request.name().trim());
        portfolio.setTemplateId(validTemplate(request.templateId()));
        portfolio.setDesign(write(normalizer.normalizeDesign(request.design())));
        portfolio.setContent(write(normalizer.normalizeContent(request.content())));
        return toResponse(portfolioRepository.saveAndFlush(portfolio));
    }

    /** Copies the draft only - the copy is not published and has no address. */
    @Transactional
    public PortfolioResponse duplicatePortfolio(Long userId, Long portfolioId) {
        ensureCapacity(userId);
        Portfolio original = findOwned(userId, portfolioId);
        String name = original.getName().length() > 112
                ? original.getName().substring(0, 112) + " (copy)"
                : original.getName() + " (copy)";
        Portfolio copy = new Portfolio(original.getUser(), name, original.getTemplateId(), original.getDesign(),
                original.getContent());
        return toResponse(portfolioRepository.saveAndFlush(copy));
    }

    @Transactional
    public void deletePortfolio(Long userId, Long portfolioId) {
        portfolioRepository.delete(findOwned(userId, portfolioId));
    }

    // ------------------------------------------------------------------ publishing

    /** Is this address free for this portfolio? (Used for live feedback while typing.) */
    @Transactional(readOnly = true)
    public SlugAvailabilityResponse checkSlug(Long userId, Long portfolioId, String input) {
        Portfolio portfolio = findOwned(userId, portfolioId);
        String slug = slugPolicy.normalize(input);
        String problem = slugPolicy.validate(slug);
        if (problem != null) {
            return new SlugAvailabilityResponse(slug, false, problem);
        }
        if (portfolioRepository.existsBySlugAndIdNot(slug, portfolio.getId())) {
            return new SlugAvailabilityResponse(slug, false, "This address is already taken");
        }
        return new SlugAvailabilityResponse(slug, true, "Available");
    }

    /** A free address based on the portfolio's hero name (e.g. "asha-verma" or "asha-verma-2"). */
    @Transactional(readOnly = true)
    public String suggestSlug(Long userId, Long portfolioId) {
        Portfolio portfolio = findOwned(userId, portfolioId);
        if (portfolio.getSlug() != null) return portfolio.getSlug();
        PortfolioContent content = read(portfolio.getContent(), PortfolioContent.class);
        String name = content.hero() != null && content.hero().name() != null ? content.hero().name()
                : portfolio.getUser().getFullName();
        String base = slugPolicy.suggestFrom(name);
        String candidate = base;
        for (int i = 2; portfolioRepository.existsBySlugAndIdNot(candidate, portfolio.getId()) && i < 1000; i++) {
            candidate = base + "-" + i;
        }
        return candidate;
    }

    /**
     * Publishes the CURRENT draft under the given address. Calling it again
     * ("Publish changes") replaces the public version with the latest draft.
     */
    @Transactional
    public PortfolioResponse publish(Long userId, Long portfolioId, String requestedSlug) {
        Portfolio portfolio = findOwned(userId, portfolioId);
        String slug = slugPolicy.normalize(requestedSlug);
        String problem = slugPolicy.validate(slug);
        if (problem != null) {
            throw new InvalidRequestException("slug", problem);
        }
        if (portfolioRepository.existsBySlugAndIdNot(slug, portfolio.getId())) {
            throw new ConflictException("slug", "This address is already taken");
        }

        portfolio.publish(slug, write(draftSnapshot(portfolio)));
        try {
            return toResponse(portfolioRepository.saveAndFlush(portfolio));
        } catch (DataIntegrityViolationException ex) {
            // two people grabbed the same address at the same moment - the unique index wins
            throw new ConflictException("slug", "This address is already taken");
        }
    }

    @Transactional
    public PortfolioResponse unpublish(Long userId, Long portfolioId) {
        Portfolio portfolio = findOwned(userId, portfolioId);
        portfolio.unpublish();
        return toResponse(portfolioRepository.saveAndFlush(portfolio));
    }

    /** The public page: published snapshot only; 404 if not published. */
    @Transactional(readOnly = true)
    public PublicPortfolioResponse getPublic(String slugInput) {
        String slug = slugPolicy.normalize(slugInput);
        Portfolio portfolio = portfolioRepository.findBySlug(slug)
                .filter(Portfolio::isPublished)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio", slug));
        PortfolioSnapshot snapshot = read(portfolio.getPublishedSnapshot(), PortfolioSnapshot.class);
        return new PublicPortfolioResponse(
                portfolio.getSlug(),
                snapshot.templateId(),
                normalizer.normalizeDesign(snapshot.design()),
                normalizer.normalizeContent(snapshot.content()),
                pictureService.getAvatarPath(portfolio.getUser().getId()),
                portfolio.getPublishedAt());
    }

    // ------------------------------------------------------------------ helpers

    public void ensureCapacity(Long userId) {
        if (portfolioRepository.countByUserId(userId) >= MAX_PORTFOLIOS_PER_USER) {
            throw new InvalidRequestException("You can have up to " + MAX_PORTFOLIOS_PER_USER
                    + " portfolios. Delete one to create another.");
        }
    }

    public static String validTemplate(String templateId) {
        String id = templateId == null ? null : templateId.trim().toLowerCase(Locale.ROOT);
        if (!PortfolioTemplates.isValid(id)) {
            throw new InvalidRequestException("templateId", "Unknown template. Choose one of: " + PortfolioTemplates.ALL);
        }
        return id;
    }

    private Portfolio findOwned(Long userId, Long portfolioId) {
        return portfolioRepository.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio", portfolioId));
    }

    private PortfolioSnapshot draftSnapshot(Portfolio p) {
        return new PortfolioSnapshot(
                p.getTemplateId(),
                normalizer.normalizeDesign(read(p.getDesign(), PortfolioDesign.class)),
                normalizer.normalizeContent(read(p.getContent(), PortfolioContent.class)));
    }

    private PortfolioPublishing publishing(Portfolio p) {
        boolean changed = false;
        if (p.isPublished()) {
            // compare the normalized draft with the normalized published version
            PortfolioSnapshot published = read(p.getPublishedSnapshot(), PortfolioSnapshot.class);
            PortfolioSnapshot normalizedPublished = new PortfolioSnapshot(published.templateId(),
                    normalizer.normalizeDesign(published.design()), normalizer.normalizeContent(published.content()));
            changed = !write(normalizedPublished).equals(write(draftSnapshot(p)));
        }
        return new PortfolioPublishing(p.getSlug(), p.isPublished(), p.getPublishedAt(), changed);
    }

    private String write(Object value) {
        try {
            String json = objectMapper.writeValueAsString(value);
            if (json.length() > MAX_CONTENT_CHARS) {
                throw new InvalidRequestException("This portfolio is too long to save. Try shortening some sections.");
            }
            return json;
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize portfolio", ex);
        }
    }

    private <T> T read(String json, Class<T> type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Stored portfolio data is not valid JSON", ex);
        }
    }

    private PortfolioResponse toResponse(Portfolio p) {
        return new PortfolioResponse(
                p.getId(),
                p.getName(),
                p.getTemplateId(),
                normalizer.normalizeDesign(read(p.getDesign(), PortfolioDesign.class)),
                normalizer.normalizeContent(read(p.getContent(), PortfolioContent.class)),
                pictureService.getAvatarPath(p.getUser().getId()),
                publishing(p),
                p.getCreatedAt(),
                p.getUpdatedAt());
    }
}
