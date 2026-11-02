package com.careercraft.dto.response;

public record PersonalInfoResponse(
        String fullName,
        String email,
        String headline,
        String phone,
        String location,
        String about,
        String websiteUrl,
        String linkedinUrl,
        String githubUrl,
        String avatarPath
) {
}
