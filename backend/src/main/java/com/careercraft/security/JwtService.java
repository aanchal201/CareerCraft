package com.careercraft.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Creates and validates JSON Web Tokens (HMAC-SHA signed).
 *
 * A token contains:
 *   sub  - the user's email
 *   uid  - the user's id
 *   role - the user's role
 *   iat / exp - issued-at and expiry timestamps
 *
 * The signature proves the token was issued by this server and not modified.
 */
@Service
public class JwtService {

    private static final int MIN_KEY_BYTES = 32; // 256 bits, required for HS256

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(@Value("${app.jwt.secret}") String base64Secret,
                      @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.signingKey = buildKey(base64Secret);
        this.expirationMs = expirationMs;
    }

    /** Fails fast at startup if JWT_SECRET is missing or too short. */
    private static SecretKey buildKey(String base64Secret) {
        if (base64Secret == null || base64Secret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET is not set. Generate one with: openssl rand -base64 64");
        }
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(base64Secret.trim());
        } catch (RuntimeException ex) {
            throw new IllegalStateException("JWT_SECRET must be a valid Base64 string", ex);
        }
        if (keyBytes.length < MIN_KEY_BYTES) {
            throw new IllegalStateException("JWT_SECRET must decode to at least 32 bytes (256 bits)");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(UserPrincipal principal) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(principal.getEmail())
                .claim("uid", principal.getId())
                .claim("role", principal.getAuthorities().iterator().next().getAuthority())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Returns the email stored in the token.
     * Throws io.jsonwebtoken.JwtException if the token is invalid, tampered with, or expired.
     */
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        Claims claims = parseClaims(token);
        return claims.getSubject().equalsIgnoreCase(userDetails.getUsername())
                && claims.getExpiration().after(new Date());
    }

    public long getExpirationSeconds() {
        return expirationMs / 1000;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
