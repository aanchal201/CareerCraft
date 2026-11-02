package com.careercraft.service.portfolio;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Rules for public portfolio addresses (/p/{slug}).
 *
 *  - 3 to 40 characters: lowercase letters, numbers and single hyphens
 *  - must start and end with a letter or number
 *  - some words are reserved so nobody can impersonate the app ("admin", "login"…)
 */
@Component
public class SlugPolicy {

    public static final int MIN_LENGTH = 3;
    public static final int MAX_LENGTH = 40;

    private static final Pattern VALID = Pattern.compile("^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$");

    private static final Set<String> RESERVED = Set.of(
            "admin", "administrator", "api", "app", "auth", "login", "logout", "register", "signup", "signin",
            "dashboard", "profile", "resumes", "resume", "portfolios", "portfolio", "analyzer", "settings",
            "account", "help", "support", "about", "contact", "terms", "privacy", "careercraft", "official",
            "root", "system", "www", "mail", "static", "assets", "public", "p", "null", "undefined", "test");

    /** Lowercases and trims; does NOT fix invalid characters (so users see exactly what's wrong). */
    public String normalize(String input) {
        return input == null ? "" : input.trim().toLowerCase(Locale.ROOT);
    }

    /** @return null if valid, otherwise a user-friendly reason. */
    public String validate(String slug) {
        if (slug.length() < MIN_LENGTH || slug.length() > MAX_LENGTH) {
            return "Use " + MIN_LENGTH + "–" + MAX_LENGTH + " characters";
        }
        if (!VALID.matcher(slug).matches() || slug.contains("--")) {
            return "Use only lowercase letters, numbers and single hyphens (not at the start or end)";
        }
        if (RESERVED.contains(slug)) {
            return "This address is reserved. Please choose another one";
        }
        return null;
    }

    /** "Asha Verma" -> "asha-verma" (accents removed, other characters dropped). */
    public String suggestFrom(String text) {
        String base = Normalizer.normalize(text == null ? "" : text, Normalizer.Form.NFKD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        if (base.length() > MAX_LENGTH - 4) {
            base = base.substring(0, MAX_LENGTH - 4).replaceAll("-+$", "");
        }
        if (base.length() < MIN_LENGTH || RESERVED.contains(base)) {
            base = "portfolio" + (base.isEmpty() ? "" : "-" + base);
        }
        return base;
    }
}
