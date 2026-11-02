package com.careercraft.service;

import com.careercraft.dto.response.UserResponse;
import com.careercraft.entity.User;
import com.careercraft.exception.ResourceNotFoundException;
import com.careercraft.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * User-related operations.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProfilePictureService pictureService;

    public UserService(UserRepository userRepository, ProfilePictureService pictureService) {
        this.userRepository = userRepository;
        this.pictureService = pictureService;
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return toResponse(user);
    }

    /** Builds the public user DTO, including the avatar URL if a picture exists. */
    @Transactional(readOnly = true)
    public UserResponse toResponse(User user) {
        return UserResponse.from(user, pictureService.getAvatarPath(user.getId()));
    }
}
