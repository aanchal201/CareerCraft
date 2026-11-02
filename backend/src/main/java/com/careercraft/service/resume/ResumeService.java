package com.careercraft.service.resume;

import com.careercraft.dto.request.CreateResumeRequest;
import com.careercraft.dto.request.UpdateResumeRequest;
import com.careercraft.dto.response.ResumeResponse;
import com.careercraft.dto.response.ResumeSummaryResponse;
import com.careercraft.dto.resume.ResumeContent;
import com.careercraft.entity.Resume;
import com.careercraft.entity.User;
import com.careercraft.exception.InvalidRequestException;
import com.careercraft.exception.ResourceNotFoundException;
import com.careercraft.repository.ProfileRepository;
import com.careercraft.repository.ResumeRepository;
import com.careercraft.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * Resume CRUD for the CURRENT user. Every lookup goes through
 * findByIdAndUserId, so another user's resume id always returns 404.
 */
@Service
public class ResumeService {

    static final int MAX_RESUMES_PER_USER = 20;
    static final int MAX_CONTENT_CHARS = 500_000;

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final ResumeContentFactory contentFactory;
    private final ResumeContentNormalizer normalizer;
    private final ObjectMapper objectMapper;

    public ResumeService(ResumeRepository resumeRepository,
                         UserRepository userRepository,
                         ProfileRepository profileRepository,
                         ResumeContentFactory contentFactory,
                         ResumeContentNormalizer normalizer,
                         ObjectMapper objectMapper) {
        this.resumeRepository = resumeRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.contentFactory = contentFactory;
        this.normalizer = normalizer;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<ResumeSummaryResponse> listResumes(Long userId) {
        return resumeRepository.findAllByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(r -> new ResumeSummaryResponse(r.getId(), r.getTitle(), r.getTemplateId(), r.getAccentColor(),
                        r.getCreatedAt(), r.getUpdatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ResumeResponse getResume(Long userId, Long resumeId) {
        return toResponse(findOwned(userId, resumeId));
    }

    @Transactional
    public ResumeResponse createResume(Long userId, CreateResumeRequest request) {
        ensureCapacity(userId);
        String templateId = validTemplate(request.templateId());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        ResumeContent content = request.prefillFromProfile()
                ? profileRepository.findByUserId(userId)
                    .map(contentFactory::fromProfile)
                    .orElseGet(() -> contentFactory.blank(user))
                : contentFactory.blank(user);

        Resume resume = new Resume(user, request.title().trim(), templateId, ResumeTemplates.DEFAULT_ACCENT,
                serialize(normalizer.normalize(content)));
        return toResponse(resumeRepository.saveAndFlush(resume));
    }

    @Transactional
    public ResumeResponse updateResume(Long userId, Long resumeId, UpdateResumeRequest request) {
        Resume resume = findOwned(userId, resumeId);
        resume.setTitle(request.title().trim());
        resume.setTemplateId(validTemplate(request.templateId()));
        resume.setAccentColor(request.accentColor().toLowerCase(Locale.ROOT));
        resume.setContent(serialize(normalizer.normalize(request.content())));
        return toResponse(resumeRepository.saveAndFlush(resume));
    }

    @Transactional
    public ResumeResponse duplicateResume(Long userId, Long resumeId) {
        ensureCapacity(userId);
        Resume original = findOwned(userId, resumeId);
        String title = original.getTitle().length() > 112
                ? original.getTitle().substring(0, 112) + " (copy)"
                : original.getTitle() + " (copy)";
        Resume copy = new Resume(original.getUser(), title, original.getTemplateId(), original.getAccentColor(),
                original.getContent());
        return toResponse(resumeRepository.saveAndFlush(copy));
    }

    @Transactional
    public void deleteResume(Long userId, Long resumeId) {
        resumeRepository.delete(findOwned(userId, resumeId));
    }

    // ------------------------------------------------------------------ helpers

    private Resume findOwned(Long userId, Long resumeId) {
        return resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", resumeId));
    }

    private void ensureCapacity(Long userId) {
        if (resumeRepository.countByUserId(userId) >= MAX_RESUMES_PER_USER) {
            throw new InvalidRequestException("You can have up to " + MAX_RESUMES_PER_USER
                    + " resumes. Delete one to create another.");
        }
    }

    private static String validTemplate(String templateId) {
        String id = templateId == null ? null : templateId.trim().toLowerCase(Locale.ROOT);
        if (!ResumeTemplates.isValid(id)) {
            throw new InvalidRequestException("templateId", "Unknown template. Choose one of: " + ResumeTemplates.ALL);
        }
        return id;
    }

    private String serialize(ResumeContent content) {
        try {
            String json = objectMapper.writeValueAsString(content);
            if (json.length() > MAX_CONTENT_CHARS) {
                throw new InvalidRequestException("This resume is too long to save. Try shortening some sections.");
            }
            return json;
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize resume content", ex);
        }
    }

    private ResumeContent deserialize(String json) {
        try {
            return objectMapper.readValue(json, ResumeContent.class);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Stored resume content is not valid JSON", ex);
        }
    }

    private ResumeResponse toResponse(Resume resume) {
        // normalize on read too, so older documents always get the current shape
        ResumeContent content = normalizer.normalize(deserialize(resume.getContent()));
        return new ResumeResponse(resume.getId(), resume.getTitle(), resume.getTemplateId(), resume.getAccentColor(),
                content, resume.getCreatedAt(), resume.getUpdatedAt());
    }
}
