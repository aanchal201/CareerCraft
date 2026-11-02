package com.careercraft.service;

import com.careercraft.entity.Profile;
import com.careercraft.entity.User;
import com.careercraft.repository.ProfileRepository;
import com.careercraft.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Runs once at startup: creates an empty profile for any user that doesn't
 * have one yet (accounts registered during Phase 1). New users get their
 * profile at registration, so after this runs every user has exactly one.
 */
@Component
public class ProfileBackfillRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProfileBackfillRunner.class);

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;

    public ProfileBackfillRunner(UserRepository userRepository, ProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<User> usersWithoutProfile = userRepository.findUsersWithoutProfile();
        if (usersWithoutProfile.isEmpty()) {
            return;
        }
        usersWithoutProfile.forEach(user -> profileRepository.save(new Profile(user)));
        log.info("Created empty profiles for {} existing user(s)", usersWithoutProfile.size());
    }
}
