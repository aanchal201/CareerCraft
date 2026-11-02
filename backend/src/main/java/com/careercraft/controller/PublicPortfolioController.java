package com.careercraft.controller;

import com.careercraft.dto.response.PublicPortfolioResponse;
import com.careercraft.service.portfolio.PortfolioService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

/**
 * PUBLIC endpoints - no login required (permitted in SecurityConfig).
 *
 * GET /api/public/portfolios/{slug} -> the published version of a portfolio, or 404
 *
 * Only the published snapshot is returned; drafts, ids and account data never leave the server.
 */
@RestController
@RequestMapping("/api/public")
public class PublicPortfolioController {

    private final PortfolioService portfolioService;

    public PublicPortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping("/portfolios/{slug}")
    public ResponseEntity<PublicPortfolioResponse> get(@PathVariable String slug) {
        return ResponseEntity.ok()
                // short cache: visitors get fast loads, republished changes appear within a minute
                .cacheControl(CacheControl.maxAge(Duration.ofSeconds(60)).cachePublic())
                .body(portfolioService.getPublic(slug));
    }
}
