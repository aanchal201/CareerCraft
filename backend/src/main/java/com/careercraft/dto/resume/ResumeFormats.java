package com.careercraft.dto.resume;

/**
 * Shared regex patterns for resume fields (used in validation annotations).
 */
public final class ResumeFormats {

    /** Empty, or year-month like "2024-06". */
    public static final String MONTH = "^$|^\\d{4}-(0[1-9]|1[0-2])$";

    /** Empty, or an http(s) URL. */
    public static final String URL = "^$|^https?://\\S+$";

    public static final String MONTH_MESSAGE = "Use the format YYYY-MM";
    public static final String URL_MESSAGE = "URL must start with http:// or https://";

    private ResumeFormats() {
    }
}
