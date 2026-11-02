package com.careercraft.util;

/**
 * Small text helpers shared by services.
 */
public final class TextUtils {

    private TextUtils() {
    }

    /** Trims the value and turns blank strings into null, so the DB never stores "   ". */
    public static String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
