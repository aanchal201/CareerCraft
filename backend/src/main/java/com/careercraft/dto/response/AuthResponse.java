package com.careercraft.dto.response;

/**
 * Returned by register and login.
 *
 * @param accessToken signed JWT the client sends as "Authorization: Bearer &lt;token&gt;"
 * @param tokenType   always "Bearer"
 * @param expiresIn   token lifetime in seconds
 * @param user        the authenticated user's public profile
 */
public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserResponse user
) {
    public static AuthResponse bearer(String token, long expiresInSeconds, UserResponse user) {
        return new AuthResponse(token, "Bearer", expiresInSeconds, user);
    }
}
