package com.careercraft.controller;

import com.careercraft.dto.response.UserResponse;
import com.careercraft.entity.ProfilePicture;
import com.careercraft.security.UserPrincipal;
import com.careercraft.service.ProfilePictureService;
import com.careercraft.service.UserService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

/**
 * User endpoints.
 *
 * GET /api/users/me              -> the currently logged-in user (JWT required)
 * GET /api/users/{id}/avatar     -> a user's profile picture (PUBLIC, see below)
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final ProfilePictureService pictureService;

    public UserController(UserService userService, ProfilePictureService pictureService) {
        this.userService = userService;
        this.pictureService = pictureService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getUserById(principal.getId()));
    }

    /**
     * Public on purpose: an HTML &lt;img src="..."&gt; tag cannot send our JWT
     * header, and avatars will also appear on public portfolios later.
     * The URL contains a version (?v=timestamp), so it is safe to let browsers
     * cache it for a long time.
     */
    @GetMapping("/{userId}/avatar")
    public ResponseEntity<byte[]> getAvatar(@PathVariable Long userId) {
        ProfilePicture picture = pictureService.getForUser(userId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(picture.getContentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                .header("X-Content-Type-Options", "nosniff")
                .body(picture.getData());
    }
}
