package com.careercraft.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Public liveness check: GET /api/health.
 * Handy for Postman, the frontend, and Render/Railway health checks.
 *
 * "clientIp" echoes the caller's IP as the server sees it. After deploying,
 * open /api/health in your browser: it should show YOUR public IP. If it
 * shows a private address (10.x, 172.x...), the proxy settings need adjusting
 * (see the Phase 9 guide), otherwise rate limits would treat all users as one.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> health(HttpServletRequest request) {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "careercraft-backend",
                "timestamp", Instant.now().toString(),
                "clientIp", request.getRemoteAddr()
        ));
    }
}
