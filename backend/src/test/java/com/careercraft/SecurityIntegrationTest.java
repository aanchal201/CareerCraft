package com.careercraft;

import com.careercraft.repository.UserRepository;
import com.careercraft.security.JwtService;
import com.careercraft.security.UserPrincipal;
import com.careercraft.support.DatabaseCleaner;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Phase 9 security checks: tokens, protected routes, headers, CORS, brute-force
 * and sign-up limits, and unsafe links. The sign-up limit is lowered to 3 so
 * the test stays fast.
 */
@SpringBootTest(properties = "app.security.register.max-per-hour=3")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityIntegrationTest {

    private static final String PASSWORD = "secret123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DatabaseCleaner databaseCleaner;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @BeforeEach
    void setUp() {
        databaseCleaner.clean();
    }

    // ------------------------------------------------------------ tokens & routes

    @ParameterizedTest
    @ValueSource(strings = {"/api/users/me", "/api/profile", "/api/resumes", "/api/analyses",
            "/api/portfolios", "/api/portfolios/ai/status", "/api/analyses/status"})
    void protectedEndpointsRequireAToken(String path) throws Exception {
        mockMvc.perform(get(path))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void tamperedTokenIsRejected() throws Exception {
        String token = register("asha@example.com");
        // change one character in the middle of the signature (the last character
        // can contain unused padding bits, so changing it might not alter the bytes)
        int index = token.length() - 10;
        char original = token.charAt(index);
        String tampered = token.substring(0, index) + (original == 'A' ? 'B' : 'A') + token.substring(index + 1);

        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + tampered))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void expiredTokenIsRejected() throws Exception {
        register("asha@example.com");
        JwtService alreadyExpired = new JwtService(jwtSecret, -60_000); // expired a minute ago
        String expired = alreadyExpired.generateToken(
                UserPrincipal.from(userRepository.findByEmail("asha@example.com").orElseThrow()));

        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + expired))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicPortfolioRoutesAreReadOnly() throws Exception {
        mockMvc.perform(post("/api/public/portfolios/anything")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/public/portfolios/does-not-exist")).andExpect(status().isNotFound());
    }

    @Test
    void responsesNeverContainPasswordHashes() throws Exception {
        String token = register("asha@example.com");
        String body = mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andReturn().getResponse().getContentAsString();
        assertThat(body.toLowerCase()).doesNotContain("password").doesNotContain("$2a$");
    }

    // ------------------------------------------------------------ headers & CORS

    @Test
    void securityHeadersAreSent() throws Exception {
        mockMvc.perform(get("/api/health").secure(true))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Content-Security-Policy", containsString("default-src 'none'")))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("Permissions-Policy", containsString("camera=()")))
                .andExpect(header().string("Strict-Transport-Security", containsString("max-age=31536000")));
    }

    @Test
    void corsAllowsOnlyConfiguredOrigins() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));

        mockMvc.perform(options("/api/auth/login")
                        .header(HttpHeaders.ORIGIN, "https://evil.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------ brute force & spam

    @Test
    void repeatedWrongPasswordsAreBlockedTemporarily() throws Exception {
        register("asha@example.com");

        for (int i = 0; i < 5; i++) {
            login("asha@example.com", "wrong-password", "198.51.100.7").andExpect(status().isUnauthorized());
        }
        // 6th try is blocked - even with the right password
        login("asha@example.com", PASSWORD, "198.51.100.7")
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists(HttpHeaders.RETRY_AFTER))
                .andExpect(jsonPath("$.message", containsString("Too many failed login attempts")));

        // the real user on another network is not locked out
        login("asha@example.com", PASSWORD, "203.0.113.20").andExpect(status().isOk());
    }

    @Test
    void successfulLoginResetsTheCounter() throws Exception {
        register("asha@example.com");
        String ip = "198.51.100.8";

        for (int i = 0; i < 4; i++) login("asha@example.com", "wrong-password", ip).andExpect(status().isUnauthorized());
        login("asha@example.com", PASSWORD, ip).andExpect(status().isOk());
        for (int i = 0; i < 4; i++) login("asha@example.com", "wrong-password", ip).andExpect(status().isUnauthorized());
        login("asha@example.com", PASSWORD, ip).andExpect(status().isOk());
    }

    @Test
    void unknownEmailsCountAsFailuresToo() throws Exception {
        for (int i = 0; i < 5; i++) {
            login("nobody@example.com", "whatever1", "198.51.100.9").andExpect(status().isUnauthorized());
        }
        login("nobody@example.com", "whatever1", "198.51.100.9").andExpect(status().isTooManyRequests());
    }

    @Test
    void signUpsArePerIpLimited() throws Exception {
        for (int i = 1; i <= 3; i++) {
            mockMvc.perform(registerRequest("user" + i + "@example.com").with(remoteAddr("198.51.100.30")))
                    .andExpect(status().isCreated());
        }
        mockMvc.perform(registerRequest("user4@example.com").with(remoteAddr("198.51.100.30")))
                .andExpect(status().isTooManyRequests());
        mockMvc.perform(registerRequest("user4@example.com").with(remoteAddr("198.51.100.31")))
                .andExpect(status().isCreated());
    }

    // ------------------------------------------------------------ unsafe content

    @Test
    void javascriptLinksAreRejected() throws Exception {
        String token = register("asha@example.com");
        MvcResult created = mockMvc.perform(post("/api/portfolios")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Main\",\"templateId\":\"minimal\",\"prefillFromProfile\":false}"))
                .andExpect(status().isCreated())
                .andReturn();
        long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(put("/api/portfolios/" + id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Main","templateId":"minimal","design":{},
                                 "content":{"hero":{"name":"Asha"},
                                            "projects":[{"id":"p1","name":"X","liveUrl":"javascript:alert(1)"}]}}
                                """))
                .andExpect(status().isBadRequest());
    }

    // ------------------------------------------------------------ helpers

    private String register(String email) throws Exception {
        MvcResult result = mockMvc.perform(registerRequest(email))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private MockHttpServletRequestBuilder registerRequest(String email) {
        return post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"fullName":"Asha Verma","email":"%s","password":"%s"}
                        """.formatted(email, PASSWORD));
    }

    private org.springframework.test.web.servlet.ResultActions login(String email, String password, String ip)
            throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .with(remoteAddr(ip))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"%s","password":"%s"}
                        """.formatted(email, password)));
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor remoteAddr(String ip) {
        return request -> {
            request.setRemoteAddr(ip);
            return request;
        };
    }
}
