package com.careercraft.controller;

import com.careercraft.dto.response.AnalysisResponse;
import com.careercraft.dto.response.AnalysisSummaryResponse;
import com.careercraft.security.UserPrincipal;
import com.careercraft.service.analysis.ResumeAnalysisService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * AI resume analyzer (JWT required).
 *
 * POST   /api/analyses          multipart: file (PDF) OR resumeId, + optional jobDescription -> 201
 * GET    /api/analyses          history (newest first, max 50)
 * GET    /api/analyses/status   is AI configured? how many analyses left today?
 * GET    /api/analyses/{id}     one analysis
 * DELETE /api/analyses/{id}     204
 */
@RestController
@RequestMapping("/api/analyses")
public class ResumeAnalysisController {

    private final ResumeAnalysisService analysisService;

    public ResumeAnalysisController(ResumeAnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnalysisResponse> analyze(@AuthenticationPrincipal UserPrincipal me,
                                                    @RequestParam(value = "file", required = false) MultipartFile file,
                                                    @RequestParam(value = "resumeId", required = false) Long resumeId,
                                                    @RequestParam(value = "jobDescription", required = false)
                                                    String jobDescription) {
        AnalysisResponse result = analysisService.analyze(me.getId(), file, resumeId, jobDescription);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping
    public ResponseEntity<List<AnalysisSummaryResponse>> list(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(analysisService.listAnalyses(me.getId()));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(analysisService.status(me.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnalysisResponse> get(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        return ResponseEntity.ok(analysisService.getAnalysis(me.getId(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        analysisService.deleteAnalysis(me.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
