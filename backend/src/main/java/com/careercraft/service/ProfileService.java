package com.careercraft.service;

import com.careercraft.dto.request.CertificationRequest;
import com.careercraft.dto.request.EducationRequest;
import com.careercraft.dto.request.ExperienceRequest;
import com.careercraft.dto.request.PersonalInfoRequest;
import com.careercraft.dto.request.SkillRequest;
import com.careercraft.dto.request.SkillsUpdateRequest;
import com.careercraft.dto.response.ProfileResponse;
import com.careercraft.entity.Certification;
import com.careercraft.entity.Education;
import com.careercraft.entity.Experience;
import com.careercraft.entity.Profile;
import com.careercraft.entity.Skill;
import com.careercraft.entity.User;
import com.careercraft.exception.InvalidRequestException;
import com.careercraft.exception.ResourceNotFoundException;
import com.careercraft.repository.ProfileRepository;
import com.careercraft.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.function.Function;

import static com.careercraft.util.TextUtils.clean;

/**
 * Profile management for the CURRENT user.
 *
 * Ownership: every method receives the authenticated user's id (from the JWT)
 * and only ever looks inside THAT user's profile. Editing an entry is done by
 * finding it in the user's own lists, so asking for someone else's entry id
 * simply returns 404 - users can never touch each other's data.
 *
 * Every mutation returns the full, fresh ProfileResponse.
 */
@Service
public class ProfileService {

    static final int MAX_ITEMS_PER_SECTION = 20;

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final ProfileMapper profileMapper;
    private final ProfilePictureService pictureService;

    public ProfileService(ProfileRepository profileRepository,
                          UserRepository userRepository,
                          ProfileMapper profileMapper,
                          ProfilePictureService pictureService) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.profileMapper = profileMapper;
        this.pictureService = pictureService;
    }

    // ------------------------------------------------------------------ read

    @Transactional
    public ProfileResponse getProfile(Long userId) {
        return toResponse(loadProfile(userId));
    }

    // ------------------------------------------------------------------ personal

    @Transactional
    public ProfileResponse updatePersonalInfo(Long userId, PersonalInfoRequest request) {
        Profile profile = loadProfile(userId);
        profile.getUser().setFullName(request.fullName().trim());
        profile.setHeadline(clean(request.headline()));
        profile.setPhone(clean(request.phone()));
        profile.setLocation(clean(request.location()));
        profile.setAbout(clean(request.about()));
        profile.setWebsiteUrl(clean(request.websiteUrl()));
        profile.setLinkedinUrl(clean(request.linkedinUrl()));
        profile.setGithubUrl(clean(request.githubUrl()));
        return save(profile);
    }

    // ------------------------------------------------------------------ education

    @Transactional
    public ProfileResponse addEducation(Long userId, EducationRequest request) {
        Profile profile = loadProfile(userId);
        ensureCapacity(profile.getEducation().size(), "education entries");
        Education education = new Education();
        applyEducation(education, request);
        profile.addEducation(education);
        return save(profile);
    }

    @Transactional
    public ProfileResponse updateEducation(Long userId, Long educationId, EducationRequest request) {
        Profile profile = loadProfile(userId);
        Education education = findById(profile.getEducation(), Education::getId, educationId, "Education");
        applyEducation(education, request);
        return save(profile);
    }

    @Transactional
    public ProfileResponse deleteEducation(Long userId, Long educationId) {
        Profile profile = loadProfile(userId);
        Education education = findById(profile.getEducation(), Education::getId, educationId, "Education");
        profile.getEducation().remove(education); // orphanRemoval deletes the row
        return save(profile);
    }

    private void applyEducation(Education e, EducationRequest r) {
        e.setInstitution(r.institution().trim());
        e.setDegree(r.degree().trim());
        e.setFieldOfStudy(clean(r.fieldOfStudy()));
        e.setStartDate(r.startDate());
        e.setCurrentlyStudying(r.currentlyStudying());
        e.setEndDate(resolveEndDate(r.startDate(), r.endDate(), r.currentlyStudying(),
                "End date is required unless you are currently studying here"));
        e.setGrade(clean(r.grade()));
        e.setDescription(clean(r.description()));
    }

    // ------------------------------------------------------------------ experience

    @Transactional
    public ProfileResponse addExperience(Long userId, ExperienceRequest request) {
        Profile profile = loadProfile(userId);
        ensureCapacity(profile.getExperiences().size(), "experience entries");
        Experience experience = new Experience();
        applyExperience(experience, request);
        profile.addExperience(experience);
        return save(profile);
    }

    @Transactional
    public ProfileResponse updateExperience(Long userId, Long experienceId, ExperienceRequest request) {
        Profile profile = loadProfile(userId);
        Experience experience = findById(profile.getExperiences(), Experience::getId, experienceId, "Experience");
        applyExperience(experience, request);
        return save(profile);
    }

    @Transactional
    public ProfileResponse deleteExperience(Long userId, Long experienceId) {
        Profile profile = loadProfile(userId);
        Experience experience = findById(profile.getExperiences(), Experience::getId, experienceId, "Experience");
        profile.getExperiences().remove(experience);
        return save(profile);
    }

    private void applyExperience(Experience e, ExperienceRequest r) {
        e.setJobTitle(r.jobTitle().trim());
        e.setCompany(r.company().trim());
        e.setEmploymentType(clean(r.employmentType()));
        e.setLocation(clean(r.location()));
        e.setStartDate(r.startDate());
        e.setCurrentlyWorking(r.currentlyWorking());
        e.setEndDate(resolveEndDate(r.startDate(), r.endDate(), r.currentlyWorking(),
                "End date is required unless you currently work here"));
        e.setDescription(clean(r.description()));
    }

    // ------------------------------------------------------------------ certifications

    @Transactional
    public ProfileResponse addCertification(Long userId, CertificationRequest request) {
        Profile profile = loadProfile(userId);
        ensureCapacity(profile.getCertifications().size(), "certifications");
        Certification certification = new Certification();
        applyCertification(certification, request);
        profile.addCertification(certification);
        return save(profile);
    }

    @Transactional
    public ProfileResponse updateCertification(Long userId, Long certificationId, CertificationRequest request) {
        Profile profile = loadProfile(userId);
        Certification certification = findById(profile.getCertifications(), Certification::getId,
                certificationId, "Certification");
        applyCertification(certification, request);
        return save(profile);
    }

    @Transactional
    public ProfileResponse deleteCertification(Long userId, Long certificationId) {
        Profile profile = loadProfile(userId);
        Certification certification = findById(profile.getCertifications(), Certification::getId,
                certificationId, "Certification");
        profile.getCertifications().remove(certification);
        return save(profile);
    }

    private void applyCertification(Certification c, CertificationRequest r) {
        if (r.expiryDate() != null && r.expiryDate().isBefore(r.issueDate())) {
            throw new InvalidRequestException("expiryDate", "Expiry date cannot be before the issue date");
        }
        c.setName(r.name().trim());
        c.setIssuer(r.issuer().trim());
        c.setIssueDate(r.issueDate());
        c.setExpiryDate(r.expiryDate());
        c.setCredentialId(clean(r.credentialId()));
        c.setCredentialUrl(clean(r.credentialUrl()));
    }

    // ------------------------------------------------------------------ skills

    /** Replaces the whole skill list. Duplicate names (case-insensitive) are dropped. */
    @Transactional
    public ProfileResponse replaceSkills(Long userId, SkillsUpdateRequest request) {
        Profile profile = loadProfile(userId);
        profile.getSkills().clear(); // orphanRemoval deletes the old rows

        Set<String> seen = new HashSet<>();
        for (SkillRequest skill : request.skills()) {
            String name = skill.name().trim();
            if (seen.add(name.toLowerCase(Locale.ROOT))) {
                profile.addSkill(new Skill(name, skill.level()));
            }
        }
        return save(profile);
    }

    // ------------------------------------------------------------------ helpers

    /**
     * Loads the user's profile. Profiles are created at registration (and for
     * older accounts by ProfileBackfillRunner at startup); creating one here
     * is a last-resort safety net.
     */
    private Profile loadProfile(Long userId) {
        return profileRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", userId));
            return profileRepository.save(new Profile(user));
        });
    }

    private ProfileResponse save(Profile profile) {
        // flush so newly added children get their generated ids before mapping
        Profile saved = profileRepository.saveAndFlush(profile);
        return toResponse(saved);
    }

    private ProfileResponse toResponse(Profile profile) {
        return profileMapper.toResponse(profile, pictureService.getAvatarPath(profile.getUser().getId()));
    }

    private static <T> T findById(List<T> items, Function<T, Long> idGetter, Long id, String label) {
        return items.stream()
                .filter(item -> id.equals(idGetter.apply(item)))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(label, id));
    }

    private static void ensureCapacity(int currentSize, String label) {
        if (currentSize >= MAX_ITEMS_PER_SECTION) {
            throw new InvalidRequestException("You can add up to " + MAX_ITEMS_PER_SECTION + " " + label);
        }
    }

    /** "Current" entries have no end date; otherwise end date is required and must not precede start. */
    private static LocalDate resolveEndDate(LocalDate start, LocalDate end, boolean current, String requiredMessage) {
        if (current) {
            return null;
        }
        if (end == null) {
            throw new InvalidRequestException("endDate", requiredMessage);
        }
        if (end.isBefore(start)) {
            throw new InvalidRequestException("endDate", "End date cannot be before the start date");
        }
        return end;
    }
}
