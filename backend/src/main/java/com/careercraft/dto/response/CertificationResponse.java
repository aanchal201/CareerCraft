package com.careercraft.dto.response;

import java.time.LocalDate;

public record CertificationResponse(
        Long id,
        String name,
        String issuer,
        LocalDate issueDate,
        LocalDate expiryDate,
        String credentialId,
        String credentialUrl
) {
}
