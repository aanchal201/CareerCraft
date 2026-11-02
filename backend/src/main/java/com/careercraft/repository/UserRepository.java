package com.careercraft.repository;

import com.careercraft.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Data access for {@link User}. Spring Data JPA generates the SQL
 * from the method names at runtime.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /** Users registered before profiles existed (Phase 1 accounts). */
    @Query("select u from User u where not exists (select p.id from Profile p where p.user = u)")
    List<User> findUsersWithoutProfile();
}
