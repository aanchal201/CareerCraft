package com.careercraft.ai;

import com.careercraft.entity.AiUsageEvent;
import com.careercraft.exception.TooManyRequestsException;
import com.careercraft.repository.AiUsageEventRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Daily (rolling 24h) limit for the portfolio AI features, which share one budget.
 */
@Service
public class AiUsageService {

    public static final String PORTFOLIO_GENERATE = "PORTFOLIO_GENERATE";
    public static final String PORTFOLIO_WRITE = "PORTFOLIO_WRITE";
    private static final List<String> PORTFOLIO_FEATURES = List.of(PORTFOLIO_GENERATE, PORTFOLIO_WRITE);

    private final AiUsageEventRepository repository;
    private final int portfolioDailyLimit;

    public AiUsageService(AiUsageEventRepository repository,
                          @Value("${app.ai.portfolio-daily-limit:10}") int portfolioDailyLimit) {
        this.repository = repository;
        this.portfolioDailyLimit = portfolioDailyLimit;
    }

    @Transactional(readOnly = true)
    public long usedToday(Long userId) {
        return repository.countByUserIdAndFeatureInAndCreatedAtAfter(userId, PORTFOLIO_FEATURES,
                Instant.now().minus(Duration.ofHours(24)));
    }

    public int dailyLimit() {
        return portfolioDailyLimit;
    }

    /** Throws 429 if the user has no portfolio AI requests left today. */
    public void ensurePortfolioQuota(Long userId) {
        if (usedToday(userId) >= portfolioDailyLimit) {
            throw new TooManyRequestsException("You've used all " + portfolioDailyLimit
                    + " AI portfolio requests for the last 24 hours. Please try again later.");
        }
    }

    @Transactional
    public void record(Long userId, String feature) {
        repository.save(new AiUsageEvent(userId, feature));
    }
}
