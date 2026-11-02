package com.careercraft.repository;

import com.careercraft.entity.ProfilePicture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface ProfilePictureRepository extends JpaRepository<ProfilePicture, Long> {

    Optional<ProfilePicture> findByUserId(Long userId);

    /**
     * Returns only the timestamp (not the image bytes) - used to build the
     * avatar URL cheaply on every profile response.
     */
    @Query("select p.updatedAt from ProfilePicture p where p.user.id = :userId")
    Optional<Instant> findUpdatedAtByUserId(@Param("userId") Long userId);
}
