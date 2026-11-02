package com.careercraft.support;

import com.careercraft.repository.AiUsageEventRepository;
import com.careercraft.repository.PortfolioRepository;
import com.careercraft.repository.ProfilePictureRepository;
import com.careercraft.repository.ProfileRepository;
import com.careercraft.repository.ResumeAnalysisRepository;
import com.careercraft.repository.ResumeRepository;
import com.careercraft.repository.UserRepository;
import com.careercraft.security.AuthRateLimiter;
import org.springframework.stereotype.Component;

/**
 * Test helper: empties every table between tests, children first
 * (foreign keys), and resets the in-memory login/sign-up rate limits so
 * tests don't affect each other. Lives in src/test, so it never ships with the app.
 * Add new repositories here as later phases add tables.
 */
@Component
public class DatabaseCleaner {

    private final AiUsageEventRepository aiUsageEventRepository;
    private final PortfolioRepository portfolioRepository;
    private final ResumeAnalysisRepository analysisRepository;
    private final ResumeRepository resumeRepository;
    private final ProfilePictureRepository profilePictureRepository;
    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final AuthRateLimiter authRateLimiter;

    public DatabaseCleaner(AiUsageEventRepository aiUsageEventRepository,
                           PortfolioRepository portfolioRepository,
                           ResumeAnalysisRepository analysisRepository,
                           ResumeRepository resumeRepository,
                           ProfilePictureRepository profilePictureRepository,
                           ProfileRepository profileRepository,
                           UserRepository userRepository,
                           AuthRateLimiter authRateLimiter) {
        this.aiUsageEventRepository = aiUsageEventRepository;
        this.portfolioRepository = portfolioRepository;
        this.analysisRepository = analysisRepository;
        this.resumeRepository = resumeRepository;
        this.profilePictureRepository = profilePictureRepository;
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.authRateLimiter = authRateLimiter;
    }

    public void clean() {
        aiUsageEventRepository.deleteAll();
        portfolioRepository.deleteAll();
        analysisRepository.deleteAll();
        resumeRepository.deleteAll();
        profilePictureRepository.deleteAll();
        profileRepository.deleteAll();
        userRepository.deleteAll();
        authRateLimiter.clear();
    }
}
