package com.careercraft.service.analysis;

import com.careercraft.dto.analysis.AtsCheck;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Rule-based ATS checks on the resume's plain text - no AI, fully
 * predictable and explainable. They ground the AI's score: the final score
 * blends both (see ResumeAnalysisService).
 */
@Component
public class LocalAtsChecker {

    private static final Pattern EMAIL = Pattern.compile("[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+");
    private static final Pattern PHONE = Pattern.compile("(\\+?\\d[\\d\\s().-]{7,}\\d)");
    private static final Pattern LINK = Pattern.compile("(linkedin\\.com|github\\.com|https?://|www\\.)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern YEAR = Pattern.compile("\\b(19|20)\\d{2}\\b");
    /** Percentages, money, "10k", "3x", "50+", or a number followed by a countable noun. Years don't count. */
    private static final Pattern METRIC = Pattern.compile(
            "(\\d+(\\.\\d+)?\\s?%|[₹$€£]\\s?\\d|\\b\\d+(\\.\\d+)?\\s?(k|m|x|lakh|crore)\\b|\\b\\d+\\+"
                    + "|\\b\\d+\\s+(users|customers|clients|people|projects|students|members|downloads|requests"
                    + "|transactions|hours|teams|engineers|employees|interns|applications|stores|countries)\\b)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern BULLET_LINE = Pattern.compile("(?m)^\\s*[•▪●◦\\-*–]\\s+\\S");
    private static final Pattern FIRST_PERSON = Pattern.compile("\\b(I|me|my|myself)\\b");

    private static final List<String> EXPERIENCE_HEADINGS = List.of("experience", "employment", "work history", "internship");
    private static final List<String> EDUCATION_HEADINGS = List.of("education", "academic", "qualification");
    private static final List<String> SKILLS_HEADINGS = List.of("skills", "technologies", "technical", "competencies", "tools");

    public static final int IDEAL_MIN_WORDS = 250;
    public static final int IDEAL_MAX_WORDS = 1000;

    public List<AtsCheck> check(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        int words = countWords(text);
        List<AtsCheck> checks = new ArrayList<>();

        boolean hasEmail = EMAIL.matcher(text).find();
        checks.add(new AtsCheck("email", "Email address", hasEmail,
                hasEmail ? "Recruiters can contact you." : "Add a professional email address at the top."));

        boolean hasPhone = hasPhoneNumber(text);
        checks.add(new AtsCheck("phone", "Phone number", hasPhone,
                hasPhone ? "Phone number found." : "Add a phone number with country code."));

        boolean hasLink = LINK.matcher(text).find();
        checks.add(new AtsCheck("links", "LinkedIn / GitHub / portfolio link", hasLink,
                hasLink ? "Professional link found." : "Add your LinkedIn, GitHub or portfolio URL."));

        int headings = (containsAny(lower, EXPERIENCE_HEADINGS) ? 1 : 0)
                + (containsAny(lower, EDUCATION_HEADINGS) ? 1 : 0)
                + (containsAny(lower, SKILLS_HEADINGS) ? 1 : 0);
        checks.add(new AtsCheck("sections", "Standard section headings", headings >= 3,
                headings >= 3 ? "Experience, Education and Skills sections were detected."
                        : "Use standard headings like \"Experience\", \"Education\" and \"Skills\" so an ATS can find them."));

        boolean goodLength = words >= IDEAL_MIN_WORDS && words <= IDEAL_MAX_WORDS;
        checks.add(new AtsCheck("length", "Resume length", goodLength,
                goodLength ? words + " words - a good length."
                        : words < IDEAL_MIN_WORDS
                        ? "Only " + words + " words. Add more detail about your work and results (aim for 300–800)."
                        : words + " words. Consider trimming to the most relevant points (aim for 300–800)."));

        int metrics = count(METRIC, text);
        boolean quantified = metrics >= 3;
        checks.add(new AtsCheck("metrics", "Quantified achievements", quantified,
                quantified ? metrics + " numbers or metrics found - great for showing impact."
                        : "Add numbers that show impact, e.g. \"reduced load time by 30%\" or \"served 10k users\"."));

        int bullets = count(BULLET_LINE, text);
        boolean usesBullets = bullets >= 3;
        checks.add(new AtsCheck("bullets", "Bullet points", usesBullets,
                usesBullets ? "Achievements are listed as bullet points."
                        : "Describe your experience with short bullet points instead of long paragraphs."));

        int years = count(YEAR, text);
        boolean hasDates = years >= 2;
        checks.add(new AtsCheck("dates", "Dates for experience and education", hasDates,
                hasDates ? "Dates found." : "Add start and end dates (month and year) to each role and degree."));

        int firstPerson = count(FIRST_PERSON, text);
        boolean noFirstPerson = firstPerson <= 2;
        checks.add(new AtsCheck("tone", "No first-person pronouns", noFirstPerson,
                noFirstPerson ? "Written in a concise, professional tone."
                        : "Avoid \"I\", \"me\" and \"my\" - start bullet points with action verbs instead."));

        return checks;
    }

    /** % of checks passed, 0-100. */
    public static int score(List<AtsCheck> checks) {
        if (checks.isEmpty()) return 0;
        long passed = checks.stream().filter(AtsCheck::passed).count();
        return (int) Math.round(passed * 100.0 / checks.size());
    }

    public static int countWords(String text) {
        String trimmed = text == null ? "" : text.trim();
        return trimmed.isEmpty() ? 0 : trimmed.split("\\s+").length;
    }

    /** A run of digits/spaces/dashes with 10-15 actual digits (so "2020 - 2024" isn't a phone number). */
    private static boolean hasPhoneNumber(String text) {
        Matcher matcher = PHONE.matcher(text);
        while (matcher.find()) {
            int digits = matcher.group().replaceAll("\\D", "").length();
            if (digits >= 10 && digits <= 15) return true;
        }
        return false;
    }

    private static boolean containsAny(String text, List<String> needles) {
        return needles.stream().anyMatch(text::contains);
    }

    private static int count(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        int count = 0;
        while (matcher.find()) count++;
        return count;
    }
}
