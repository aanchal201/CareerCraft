package com.careercraft.dto.response;

import com.careercraft.entity.User;

import java.time.Instant;

/**
 * Public view of a user. Never contains the password hash.
 *
 * @param avatarPath API-relative URL of the profile picture
 *                   (e.g. "/users/1/avatar?v=1730612345000") or null if none.
 */
public record UserResponse(
        Long id,
        String fullName,
        String email,
        String role,
        Instant createdAt,
        String avatarPath
) {
    public static UserResponse from(User user, String avatarPath) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getCreatedAt(),
                avatarPath
        );
    }
}
