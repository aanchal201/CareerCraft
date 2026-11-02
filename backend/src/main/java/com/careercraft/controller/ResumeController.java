package com.careercraft.controller;

import com.careercraft.dto.request.CreateResumeRequest;
import com.careercraft.dto.request.UpdateResumeRequest;
import com.careercraft.dto.response.ResumeResponse;
import com.careercraft.dto.response.ResumeSummaryResponse;
import com.careercraft.security.UserPrincipal;
import com.careercraft.service.resume.ResumeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * The logged-in user's resumes (JWT required).
 *
 * GET    /api/resumes                 -> list (newest first)
 * POST   /api/resumes                 -> create (201)
 * GET    /api/resumes/{id}            -> full resume
 * PUT    /api/resumes/{id}            -> save (used by the editor's autosave)
 * POST   /api/resumes/{id}/duplicate  -> copy (201)
 * DELETE /api/resumes/{id}            -> delete (204)
 */
@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @GetMapping
    public ResponseEntity<List<ResumeSummaryResponse>> list(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(resumeService.listResumes(me.getId()));
    }

    @PostMapping
    public ResponseEntity<ResumeResponse> create(@AuthenticationPrincipal UserPrincipal me,
                                                 @Valid @RequestBody CreateResumeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resumeService.createResume(me.getId(), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResumeResponse> get(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        return ResponseEntity.ok(resumeService.getResume(me.getId(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResumeResponse> update(@AuthenticationPrincipal UserPrincipal me,
                                                 @PathVariable Long id,
                                                 @Valid @RequestBody UpdateResumeRequest request) {
        return ResponseEntity.ok(resumeService.updateResume(me.getId(), id, request));
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<ResumeResponse> duplicate(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resumeService.duplicateResume(me.getId(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        resumeService.deleteResume(me.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
