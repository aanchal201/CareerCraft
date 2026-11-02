package com.careercraft.controller;

import com.careercraft.dto.request.CertificationRequest;
import com.careercraft.dto.request.EducationRequest;
import com.careercraft.dto.request.ExperienceRequest;
import com.careercraft.dto.request.PersonalInfoRequest;
import com.careercraft.dto.request.SkillsUpdateRequest;
import com.careercraft.dto.response.ProfileResponse;
import com.careercraft.security.UserPrincipal;
import com.careercraft.service.ProfilePictureService;
import com.careercraft.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * The logged-in user's profile. All endpoints require a JWT and operate
 * ONLY on the caller's own profile (the user id comes from the token, never
 * from the URL). Every endpoint returns the full, updated ProfileResponse.
 */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;
    private final ProfilePictureService pictureService;

    public ProfileController(ProfileService profileService, ProfilePictureService pictureService) {
        this.profileService = profileService;
        this.pictureService = pictureService;
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(profileService.getProfile(me.getId()));
    }

    // ---------------- Personal info ----------------

    @PutMapping("/personal")
    public ResponseEntity<ProfileResponse> updatePersonal(@AuthenticationPrincipal UserPrincipal me,
                                                          @Valid @RequestBody PersonalInfoRequest request) {
        return ResponseEntity.ok(profileService.updatePersonalInfo(me.getId(), request));
    }

    // ---------------- Profile picture ----------------

    @PostMapping(value = "/picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProfileResponse> uploadPicture(@AuthenticationPrincipal UserPrincipal me,
                                                         @RequestParam("file") MultipartFile file) {
        pictureService.upload(me.getId(), file);
        return ResponseEntity.ok(profileService.getProfile(me.getId()));
    }

    @DeleteMapping("/picture")
    public ResponseEntity<ProfileResponse> deletePicture(@AuthenticationPrincipal UserPrincipal me) {
        pictureService.delete(me.getId());
        return ResponseEntity.ok(profileService.getProfile(me.getId()));
    }

    // ---------------- Education ----------------

    @PostMapping("/education")
    public ResponseEntity<ProfileResponse> addEducation(@AuthenticationPrincipal UserPrincipal me,
                                                        @Valid @RequestBody EducationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(profileService.addEducation(me.getId(), request));
    }

    @PutMapping("/education/{id}")
    public ResponseEntity<ProfileResponse> updateEducation(@AuthenticationPrincipal UserPrincipal me,
                                                           @PathVariable Long id,
                                                           @Valid @RequestBody EducationRequest request) {
        return ResponseEntity.ok(profileService.updateEducation(me.getId(), id, request));
    }

    @DeleteMapping("/education/{id}")
    public ResponseEntity<ProfileResponse> deleteEducation(@AuthenticationPrincipal UserPrincipal me,
                                                           @PathVariable Long id) {
        return ResponseEntity.ok(profileService.deleteEducation(me.getId(), id));
    }

    // ---------------- Experience ----------------

    @PostMapping("/experience")
    public ResponseEntity<ProfileResponse> addExperience(@AuthenticationPrincipal UserPrincipal me,
                                                         @Valid @RequestBody ExperienceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(profileService.addExperience(me.getId(), request));
    }

    @PutMapping("/experience/{id}")
    public ResponseEntity<ProfileResponse> updateExperience(@AuthenticationPrincipal UserPrincipal me,
                                                            @PathVariable Long id,
                                                            @Valid @RequestBody ExperienceRequest request) {
        return ResponseEntity.ok(profileService.updateExperience(me.getId(), id, request));
    }

    @DeleteMapping("/experience/{id}")
    public ResponseEntity<ProfileResponse> deleteExperience(@AuthenticationPrincipal UserPrincipal me,
                                                            @PathVariable Long id) {
        return ResponseEntity.ok(profileService.deleteExperience(me.getId(), id));
    }

    // ---------------- Certifications ----------------

    @PostMapping("/certifications")
    public ResponseEntity<ProfileResponse> addCertification(@AuthenticationPrincipal UserPrincipal me,
                                                            @Valid @RequestBody CertificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(profileService.addCertification(me.getId(), request));
    }

    @PutMapping("/certifications/{id}")
    public ResponseEntity<ProfileResponse> updateCertification(@AuthenticationPrincipal UserPrincipal me,
                                                               @PathVariable Long id,
                                                               @Valid @RequestBody CertificationRequest request) {
        return ResponseEntity.ok(profileService.updateCertification(me.getId(), id, request));
    }

    @DeleteMapping("/certifications/{id}")
    public ResponseEntity<ProfileResponse> deleteCertification(@AuthenticationPrincipal UserPrincipal me,
                                                               @PathVariable Long id) {
        return ResponseEntity.ok(profileService.deleteCertification(me.getId(), id));
    }

    // ---------------- Skills ----------------

    @PutMapping("/skills")
    public ResponseEntity<ProfileResponse> replaceSkills(@AuthenticationPrincipal UserPrincipal me,
                                                         @Valid @RequestBody SkillsUpdateRequest request) {
        return ResponseEntity.ok(profileService.replaceSkills(me.getId(), request));
    }
}
