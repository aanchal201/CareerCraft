package com.careercraft.dto.analysis;

/**
 * One rule-based ATS check (no AI involved), e.g. "Email address found".
 *
 * @param key    stable id, e.g. "email"
 * @param label  what was checked
 * @param passed whether the resume passes
 * @param detail explanation / what to do
 */
public record AtsCheck(String key, String label, boolean passed, String detail) {
}
