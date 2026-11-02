package com.careercraft.controller;

import com.careercraft.dto.request.LoginRequest;
import com.careercraft.dto.request.RegisterRequest;
import com.careercraft.dto.response.AuthResponse;
import com.careercraft.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public authentication endpoints.
 *
 * POST /api/auth/register -> 201 Created + AuthResponse
 * POST /api/auth/login    -> 200 OK      + AuthResponse
 *
 * Logout is handled on the client by discarding the token
 * (JWTs are stateless - see the Phase 1 guide for details).
 *
 * Both endpoints are rate limited per client IP (429 + Retry-After). Behind a
 * proxy such as Render/Railway, getRemoteAddr() returns the real client IP
 * because server.forward-headers-strategy is enabled in application.yml.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
                                                 HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request, httpRequest.getRemoteAddr()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest.getRemoteAddr()));
    }
}
