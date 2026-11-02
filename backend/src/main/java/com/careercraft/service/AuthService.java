package com.careercraft.service;

import com.careercraft.dto.request.LoginRequest;
import com.careercraft.dto.request.RegisterRequest;
import com.careercraft.dto.response.AuthResponse;
import com.careercraft.entity.Profile;
import com.careercraft.entity.User;
import com.careercraft.exception.EmailAlreadyExistsException;
import com.careercraft.repository.ProfileRepository;
import com.careercraft.repository.UserRepository;
import com.careercraft.security.AuthRateLimiter;
import com.careercraft.security.JwtService;
import com.careercraft.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * Business logic for registration and login.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;
    private final AuthRateLimiter rateLimiter;

    public AuthService(UserRepository userRepository,
                       ProfileRepository profileRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       UserService userService,
                       AuthRateLimiter rateLimiter) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userService = userService;
        this.rateLimiter = rateLimiter;
    }

    /**
     * Creates a new account (plus its empty profile) and immediately returns
     * a token, so the user is logged in right after registering.
     *
     * @param clientIp caller's IP, for the sign-up rate limit (429 when exceeded)
     */
    @Transactional
    public AuthResponse register(RegisterRequest request, String clientIp) {
        rateLimiter.checkRegistration(clientIp);
        String email = normalizeEmail(request.email());

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        User user = new User(
                request.fullName().trim(),
                email,
                passwordEncoder.encode(request.password())
        );
        User saved = userRepository.save(user);
        profileRepository.save(new Profile(saved));
        rateLimiter.recordRegistration(clientIp);

        return buildAuthResponse(saved);
    }

    /**
     * Verifies credentials via Spring Security's AuthenticationManager
     * (which loads the user and compares the BCrypt hash). Throws
     * BadCredentialsException on failure -> mapped to 401.
     *
     * Brute-force protection: repeated failures for the same email + IP are
     * counted, and once over the limit the endpoint answers 429 without
     * checking the password at all (see AuthRateLimiter).
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request, String clientIp) {
        String email = normalizeEmail(request.email());
        rateLimiter.checkLogin(clientIp, email);

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password())
            );
        } catch (AuthenticationException ex) {
            rateLimiter.recordLoginFailure(clientIp, email);
            throw ex;
        }
        rateLimiter.recordLoginSuccess(clientIp, email);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new IllegalStateException("Authenticated user disappeared"));

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(UserPrincipal.from(user));
        return AuthResponse.bearer(token, jwtService.getExpirationSeconds(), userService.toResponse(user));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
