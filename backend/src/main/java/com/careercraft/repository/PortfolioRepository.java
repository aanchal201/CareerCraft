package com.careercraft.repository;

import com.careercraft.entity.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    List<Portfolio> findAllByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<Portfolio> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    Optional<Portfolio> findBySlug(String slug);

    /** Is the slug used by a portfolio OTHER than this one? */
    boolean existsBySlugAndIdNot(String slug, Long id);

    boolean existsBySlug(String slug);
}
