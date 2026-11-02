package com.careercraft.repository;

import com.careercraft.entity.ResumeAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeAnalysisRepository extends JpaRepository<ResumeAnalysis, Long> {

    List<ResumeAnalysis> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<ResumeAnalysis> findByIdAndUserId(Long id, Long userId);

    /** Used for the per-user daily limit. */
    long countByUserIdAndCreatedAtAfter(Long userId, Instant since);
}
