package com.careercraft.repository;

import com.careercraft.entity.AiUsageEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;

@Repository
public interface AiUsageEventRepository extends JpaRepository<AiUsageEvent, Long> {

    long countByUserIdAndFeatureInAndCreatedAtAfter(Long userId, Collection<String> features, Instant since);
}
