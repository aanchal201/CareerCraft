package com.careercraft.service.analysis;

import com.careercraft.ai.AiServiceException;
import com.careercraft.ai.GrokClient;
import com.careercraft.dto.analysis.AiAnalysis;
import com.careercraft.dto.analysis.AtsCheck;
import com.careercraft.dto.analysis.StoredAnalysis;
import com.careercraft.dto.response.AnalysisResponse;
import com.careercraft.dto.response.AnalysisSummaryResponse;
import com.careercraft.dto.response.ResumeResponse;
import com.careercraft.entity.AnalysisSource;
import com.careercraft.entity.ResumeAnalysis;
import com.careercraft.entity.User;
import com.careercraft.exception.InvalidRequestException;
import com.careercraft.exception.ResourceNotFoundException;
import com.careercraft.exception.TooManyRequestsException;
import com.careercraft.repository.ResumeAnalysisRepository;
import com.careercraft.repository.UserRepository;
import com.careercraft.service.resume.ResumeService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import static com.careercraft.util.TextUtils.clean;

/**
 * Runs an AI resume analysis:
 *
 *  1. get the resume text (uploaded PDF -> PDFBox, or a saved resume -> plain text)
 *  2. run the rule-based ATS checks (instant, no AI)
 *  3. ask Grok for a structured analysis (and job match, if a JD was given)
 *  4. sanitize the answer, blend the scores, save it to history
 *
 * Note: this method is NOT one big transaction. The AI call can take 10-60s
 * and we don't want to hold a database connection that long, so only the
 * final save runs in a (short) transaction.
 */
@Service
public class ResumeAnalysisService {

    static final int MAX_JOB_DESCRIPTION_CHARS = 15_000;
    static final int MIN_JOB_DESCRIPTION_CHARS = 50;
    static final int MIN_RESUME_TEXT_CHARS = 150;
    static final double AI_WEIGHT = 0.7;

    private final ResumeAnalysisRepository analysisRepository;
    private final UserRepository userRepository;
    private final ResumeService resumeService;
    private final ResumeTextExtractor textExtractor;
    private final ResumePlainTextRenderer plainTextRenderer;
    private final LocalAtsChecker atsChecker;
    private final AnalysisSanitizer sanitizer;
    private final GrokClient grokClient;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;
    private final int dailyLimit;

    public ResumeAnalysisService(ResumeAnalysisRepository analysisRepository,
                                 UserRepository userRepository,
                                 ResumeService resumeService,
                                 ResumeTextExtractor textExtractor,
                                 ResumePlainTextRenderer plainTextRenderer,
                                 LocalAtsChecker atsChecker,
                                 AnalysisSanitizer sanitizer,
                                 GrokClient grokClient,
                                 ObjectMapper objectMapper,
                                 PlatformTransactionManager transactionManager,
                                 @Value("${app.ai.daily-limit:20}") int dailyLimit) {
        this.analysisRepository = analysisRepository;
        this.userRepository = userRepository;
        this.resumeService = resumeService;
        this.textExtractor = textExtractor;
        this.plainTextRenderer = plainTextRenderer;
        this.atsChecker = atsChecker;
        this.sanitizer = sanitizer;
        this.grokClient = grokClient;
        this.objectMapper = objectMapper;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.dailyLimit = dailyLimit;
    }

    // ------------------------------------------------------------------ analyze

    public AnalysisResponse analyze(Long userId, MultipartFile file, Long resumeId, String jobDescriptionInput) {
        boolean hasFile = file != null && !file.isEmpty();
        if (hasFile == (resumeId != null)) {
            throw new InvalidRequestException("Choose either a PDF to upload or one of your saved resumes.");
        }

        String jobDescription = validateJobDescription(jobDescriptionInput);
        boolean withJob = jobDescription != null;

        if (!grokClient.isConfigured()) {
            throw AiServiceException.notConfigured();
        }
        ensureWithinDailyLimit(userId);

        // 1. resume text
        AnalysisSource source;
        String sourceName;
        String resumeText;
        if (hasFile) {
            source = AnalysisSource.UPLOAD;
            sourceName = safeFileName(file.getOriginalFilename());
            resumeText = textExtractor.extract(file);
        } else {
            ResumeResponse resume = resumeService.getResume(userId, resumeId); // 404 if not the user's
            source = AnalysisSource.SAVED_RESUME;
            sourceName = resume.title();
            resumeText = plainTextRenderer.render(resume.content());
            if (resumeText.length() < MIN_RESUME_TEXT_CHARS) {
                throw new InvalidRequestException("resumeId",
                        "This resume is almost empty. Add your experience, education and skills first.");
            }
        }

        // 2. rule-based checks
        List<AtsCheck> checks = atsChecker.check(resumeText);
        int checksScore = LocalAtsChecker.score(checks);
        int wordCount = LocalAtsChecker.countWords(resumeText);

        // 3. AI analysis
        AiAnalysis raw = grokClient.generateStructured(
                AnalysisPrompts.instructions(withJob, LocalDate.now(ZoneOffset.UTC)),
                AnalysisPrompts.userContent(resumeText, jobDescription),
                AnalysisPrompts.SCHEMA_NAME,
                AnalysisPrompts.schema(withJob),
                AiAnalysis.class);
        AiAnalysis ai = sanitizer.sanitize(raw, withJob);

        // 4. blend scores and save
        int atsScore = (int) Math.round(ai.atsScore() * AI_WEIGHT + checksScore * (1 - AI_WEIGHT));
        Integer matchScore = ai.jobMatch() != null ? ai.jobMatch().matchScore() : null;
        String jobTitle = ai.jobMatch() != null && !ai.jobMatch().jobTitle().isBlank() ? ai.jobMatch().jobTitle() : null;
        String resultJson = toJson(new StoredAnalysis(ai, checks, ai.atsScore(), checksScore, wordCount));

        Long sourceResumeId = hasFile ? null : resumeId;
        ResumeAnalysis saved = transactionTemplate.execute(status -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", userId));
            return analysisRepository.save(new ResumeAnalysis(user, source, sourceName, sourceResumeId,
                    jobDescription, jobTitle, atsScore, matchScore, resultJson, grokClient.modelName()));
        });
        return toResponse(saved);
    }

    // ------------------------------------------------------------------ history

    @Transactional(readOnly = true)
    public List<AnalysisSummaryResponse> listAnalyses(Long userId) {
        return analysisRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(a -> new AnalysisSummaryResponse(a.getId(), a.getSourceType().name(), a.getSourceName(),
                        a.getResumeId(), a.getJobTitle(), a.getJobDescription() != null, a.getAtsScore(),
                        a.getMatchScore(), a.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public AnalysisResponse getAnalysis(Long userId, Long analysisId) {
        return toResponse(findOwned(userId, analysisId));
    }

    @Transactional
    public void deleteAnalysis(Long userId, Long analysisId) {
        analysisRepository.delete(findOwned(userId, analysisId));
    }

    /** For the UI: is AI available, and how many analyses are left today? */
    @Transactional(readOnly = true)
    public Map<String, Object> status(Long userId) {
        long used = analysisRepository.countByUserIdAndCreatedAtAfter(userId, Instant.now().minus(Duration.ofHours(24)));
        return Map.of(
                "aiConfigured", grokClient.isConfigured(),
                "model", grokClient.isConfigured() ? grokClient.modelName() : "",
                "dailyLimit", dailyLimit,
                "usedToday", used,
                "remainingToday", Math.max(0, dailyLimit - used)
        );
    }

    // ------------------------------------------------------------------ helpers

    private ResumeAnalysis findOwned(Long userId, Long analysisId) {
        return analysisRepository.findByIdAndUserId(analysisId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis", analysisId));
    }

    private void ensureWithinDailyLimit(Long userId) {
        long used = analysisRepository.countByUserIdAndCreatedAtAfter(userId, Instant.now().minus(Duration.ofHours(24)));
        if (used >= dailyLimit) {
            throw new TooManyRequestsException("You've used all " + dailyLimit
                    + " analyses for the last 24 hours. Please try again later.");
        }
    }

    private static String validateJobDescription(String input) {
        String jd = clean(input);
        if (jd == null) return null;
        if (jd.length() > MAX_JOB_DESCRIPTION_CHARS) {
            throw new InvalidRequestException("jobDescription",
                    "Job description must be at most " + MAX_JOB_DESCRIPTION_CHARS + " characters");
        }
        if (jd.length() < MIN_JOB_DESCRIPTION_CHARS) {
            throw new InvalidRequestException("jobDescription",
                    "Paste the full job description (at least " + MIN_JOB_DESCRIPTION_CHARS + " characters)");
        }
        return jd;
    }

    private static String safeFileName(String original) {
        if (original == null || original.isBlank()) return "Uploaded resume.pdf";
        String name = original.replaceAll("[\\\\/]", "_").trim(); // never keep client paths
        return name.length() > 200 ? name.substring(0, 200) : name;
    }

    private String toJson(StoredAnalysis stored) {
        try {
            return objectMapper.writeValueAsString(stored);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize analysis", ex);
        }
    }

    private AnalysisResponse toResponse(ResumeAnalysis a) {
        StoredAnalysis stored;
        try {
            stored = objectMapper.readValue(a.getResult(), StoredAnalysis.class);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Stored analysis is not valid JSON", ex);
        }
        return new AnalysisResponse(a.getId(), a.getSourceType().name(), a.getSourceName(), a.getResumeId(),
                a.getJobTitle(), a.getJobDescription(), a.getAtsScore(), stored.aiScore(), stored.checksScore(),
                a.getMatchScore(), stored.wordCount(), stored.ai(), stored.atsChecks(), a.getModel(),
                a.getCreatedAt());
    }
}
