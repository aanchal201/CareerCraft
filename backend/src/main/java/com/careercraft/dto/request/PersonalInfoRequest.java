package com.careercraft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Body of PUT /api/profile/personal. Every field except fullName is optional;
 * blank strings are stored as null.
 */
public record PersonalInfoRequest(

        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
        String fullName,

        @Size(max = 120, message = "Headline must be at most 120 characters")
        String headline,

        @Pattern(regexp = "^$|^[+0-9()\\-\\s]{7,20}$", message = "Please enter a valid phone number")
        String phone,

        @Size(max = 100, message = "Location must be at most 100 characters")
        String location,

        @Size(max = 2000, message = "About must be at most 2000 characters")
        String about,

        @Size(max = 255, message = "URL must be at most 255 characters")
        @Pattern(regexp = "^$|^https?://\\S+$", message = "URL must start with http:// or https://")
        String websiteUrl,

        @Size(max = 255, message = "URL must be at most 255 characters")
        @Pattern(regexp = "^$|^https?://\\S+$", message = "URL must start with http:// or https://")
        String linkedinUrl,

        @Size(max = 255, message = "URL must be at most 255 characters")
        @Pattern(regexp = "^$|^https?://\\S+$", message = "URL must start with http:// or https://")
        String githubUrl
) {
}
