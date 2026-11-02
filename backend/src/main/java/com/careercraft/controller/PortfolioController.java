package com.careercraft.controller;

import com.careercraft.dto.portfolio.PortfolioAiContent;
import com.careercraft.dto.request.AiWriteRequest;
import com.careercraft.dto.request.CreatePortfolioRequest;
import com.careercraft.dto.request.GeneratePortfolioRequest;
import com.careercraft.dto.request.PublishPortfolioRequest;
import com.careercraft.dto.request.UpdatePortfolioRequest;
import com.careercraft.dto.response.PortfolioResponse;
import com.careercraft.dto.response.PortfolioSummaryResponse;
import com.careercraft.dto.response.SlugAvailabilityResponse;
import com.careercraft.security.UserPrincipal;
import com.careercraft.service.portfolio.PortfolioGenerationService;
import com.careercraft.service.portfolio.PortfolioService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * The logged-in user's portfolios (JWT required).
 *
 * GET    /api/portfolios                      list
 * POST   /api/portfolios                      create (201)
 * POST   /api/portfolios/generate             create from a saved resume, optionally with AI (201)
 * GET    /api/portfolios/ai/status            AI available? requests left today?
 * GET    /api/portfolios/{id}                 full portfolio (+ publishing state)
 * PUT    /api/portfolios/{id}                 save draft (editor autosave)
 * POST   /api/portfolios/{id}/duplicate       copy (201)
 * DELETE /api/portfolios/{id}                 delete (204) - also takes the public page down
 * POST   /api/portfolios/{id}/ai/write        AI suggestions for intro/skills/projects (not saved)
 * GET    /api/portfolios/{id}/slug            check an address  ?value=asha-verma  (or suggest one)
 * POST   /api/portfolios/{id}/publish         publish / republish the current draft
 * POST   /api/portfolios/{id}/unpublish       take the public page down
 *
 * The public page itself is served by PublicPortfolioController (no login).
 */
@RestController
@RequestMapping("/api/portfolios")
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final PortfolioGenerationService generationService;

    public PortfolioController(PortfolioService portfolioService, PortfolioGenerationService generationService) {
        this.portfolioService = portfolioService;
        this.generationService = generationService;
    }

    @GetMapping
    public ResponseEntity<List<PortfolioSummaryResponse>> list(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(portfolioService.listPortfolios(me.getId()));
    }

    @PostMapping
    public ResponseEntity<PortfolioResponse> create(@AuthenticationPrincipal UserPrincipal me,
                                                    @Valid @RequestBody CreatePortfolioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(portfolioService.createPortfolio(me.getId(), request));
    }

    @PostMapping("/generate")
    public ResponseEntity<PortfolioResponse> generate(@AuthenticationPrincipal UserPrincipal me,
                                                      @Valid @RequestBody GeneratePortfolioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(generationService.generate(me.getId(), request));
    }

    @GetMapping("/ai/status")
    public ResponseEntity<Map<String, Object>> aiStatus(@AuthenticationPrincipal UserPrincipal me) {
        return ResponseEntity.ok(generationService.aiStatus(me.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PortfolioResponse> get(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        return ResponseEntity.ok(portfolioService.getPortfolio(me.getId(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PortfolioResponse> update(@AuthenticationPrincipal UserPrincipal me,
                                                    @PathVariable Long id,
                                                    @Valid @RequestBody UpdatePortfolioRequest request) {
        return ResponseEntity.ok(portfolioService.updatePortfolio(me.getId(), id, request));
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<PortfolioResponse> duplicate(@AuthenticationPrincipal UserPrincipal me,
                                                       @PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(portfolioService.duplicatePortfolio(me.getId(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        portfolioService.deletePortfolio(me.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/ai/write")
    public ResponseEntity<PortfolioAiContent> aiWrite(@AuthenticationPrincipal UserPrincipal me,
                                                      @PathVariable Long id,
                                                      @Valid @RequestBody AiWriteRequest request) {
        return ResponseEntity.ok(generationService.writeWithAi(me.getId(), id, request.tone()));
    }

    /** Without ?value= it suggests a free address; with it, it checks that address. */
    @GetMapping("/{id}/slug")
    public ResponseEntity<SlugAvailabilityResponse> slug(@AuthenticationPrincipal UserPrincipal me,
                                                         @PathVariable Long id,
                                                         @RequestParam(value = "value", required = false) String value) {
        String slug = value == null || value.isBlank() ? portfolioService.suggestSlug(me.getId(), id) : value;
        return ResponseEntity.ok(portfolioService.checkSlug(me.getId(), id, slug));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<PortfolioResponse> publish(@AuthenticationPrincipal UserPrincipal me,
                                                     @PathVariable Long id,
                                                     @Valid @RequestBody PublishPortfolioRequest request) {
        return ResponseEntity.ok(portfolioService.publish(me.getId(), id, request.slug()));
    }

    @PostMapping("/{id}/unpublish")
    public ResponseEntity<PortfolioResponse> unpublish(@AuthenticationPrincipal UserPrincipal me,
                                                       @PathVariable Long id) {
        return ResponseEntity.ok(portfolioService.unpublish(me.getId(), id));
    }
}
