package com.careercraft.service;

import com.careercraft.dto.response.ProfileCompletionResponse;
import com.careercraft.entity.Profile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

import static com.careercraft.util.TextUtils.hasText;

/**
 * Calculates how complete a profile is.
 *
 * Each checklist item has a weight; weights add up to 100. Sections that
 * matter most for a resume (education, experience) weigh more. The calculation
 * lives on the backend so every client gets the same number, and it can be
 * reused later by resumes and portfolios.
 */
@Component
public class ProfileCompletionCalculator {

    static final int MIN_SKILLS = 3;

    public ProfileCompletionResponse calculate(Profile profile, boolean hasPicture) {
        List<ProfileCompletionResponse.Item> items = new ArrayList<>();

        items.add(item("photo", "Add a profile photo", "personal", 10, hasPicture));
        items.add(item("headline", "Write a professional headline", "personal", 10, hasText(profile.getHeadline())));
        items.add(item("about", "Write a short bio", "personal", 10, hasText(profile.getAbout())));
        items.add(item("contact", "Add your phone and location", "personal", 10,
                hasText(profile.getPhone()) && hasText(profile.getLocation())));
        items.add(item("links", "Add a LinkedIn, GitHub or website link", "personal", 10,
                hasText(profile.getLinkedinUrl()) || hasText(profile.getGithubUrl()) || hasText(profile.getWebsiteUrl())));
        items.add(item("education", "Add your education", "education", 15, !profile.getEducation().isEmpty()));
        items.add(item("experience", "Add work experience or an internship", "experience", 15,
                !profile.getExperiences().isEmpty()));
        items.add(item("skills", "Add at least " + MIN_SKILLS + " skills", "skills", 10,
                profile.getSkills().size() >= MIN_SKILLS));
        items.add(item("certifications", "Add a certification", "certifications", 10,
                !profile.getCertifications().isEmpty()));

        int percentage = items.stream()
                .filter(ProfileCompletionResponse.Item::completed)
                .mapToInt(ProfileCompletionResponse.Item::weight)
                .sum();

        return new ProfileCompletionResponse(Math.min(percentage, 100), items);
    }

    private static ProfileCompletionResponse.Item item(String key, String label, String section,
                                                       int weight, boolean completed) {
        return new ProfileCompletionResponse.Item(key, label, section, weight, completed);
    }
}
