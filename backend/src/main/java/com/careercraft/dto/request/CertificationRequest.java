package com.careercraft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Body of POST/PUT /api/profile/certifications.
 */
public record CertificationRequest(

        @NotBlank(message = "Certification name is required")
        @Size(max = 150, message = "Name must be at most 150 characters")
        String name,

        @NotBlank(message = "Issuer is required")
        @Size(max = 150, message = "Issuer must be at most 150 characters")
        String issuer,

        @NotNull(message = "Issue date is required")
        LocalDate issueDate,

        LocalDate expiryDate,

        @Size(max = 100, message = "Credential ID must be at most 100 characters")
        String credentialId,

        @Size(max = 255, message = "URL must be at most 255 characters")
        @Pattern(regexp = "^$|^https?://\\S+$", message = "URL must start with http:// or https://")
        String credentialUrl
) {
}
