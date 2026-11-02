package com.careercraft;

import com.careercraft.support.DatabaseCleaner;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end tests for profile management (Phase 2).
 * Run with:  mvn test
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProfileControllerIntegrationTest {

    /** Smallest valid-looking PNG header + a few bytes (we only check the signature). */
    private static final byte[] PNG_BYTES = {
            (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D, 'I', 'H', 'D', 'R'
    };

    private static final String EDUCATION_BODY = """
            {"institution":"IIT Bombay","degree":"B.Tech","fieldOfStudy":"Computer Science",
             "startDate":"2020-08-01","endDate":"2024-05-01","currentlyStudying":false,"grade":"8.9 CGPA"}
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DatabaseCleaner databaseCleaner;

    @BeforeEach
    void cleanDatabase() {
        databaseCleaner.clean();
    }

    @Test
    void profileRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/profile")).andExpect(status().isUnauthorized());
    }

    @Test
    void newProfileIsEmptyWithZeroCompletion() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        mockMvc.perform(get("/api/profile").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personal.fullName").value("Asha Verma"))
                .andExpect(jsonPath("$.personal.email").value("asha@example.com"))
                .andExpect(jsonPath("$.education").isEmpty())
                .andExpect(jsonPath("$.completion.percentage").value(0))
                .andExpect(jsonPath("$.completion.items.length()").value(9));
    }

    @Test
    void updatePersonalInfoChangesNameAndRaisesCompletion() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        mockMvc.perform(put("/api/profile/personal")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Asha R. Verma","headline":"Full-stack developer",
                                 "phone":"+91 98765 43210","location":"Mumbai","about":"I build web apps.",
                                 "linkedinUrl":"https://linkedin.com/in/asha","githubUrl":"","websiteUrl":""}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personal.fullName").value("Asha R. Verma"))
                .andExpect(jsonPath("$.personal.githubUrl").doesNotExist())
                // headline 10 + about 10 + contact 10 + links 10 = 40
                .andExpect(jsonPath("$.completion.percentage").value(40));
    }

    @Test
    void invalidPersonalInfoReturns400() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        mockMvc.perform(put("/api/profile/personal")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"A","linkedinUrl":"linkedin.com/in/asha","phone":"abc"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.fullName").exists())
                .andExpect(jsonPath("$.fieldErrors.linkedinUrl").exists())
                .andExpect(jsonPath("$.fieldErrors.phone").exists());
    }

    @Test
    void educationCanBeAddedUpdatedAndDeleted() throws Exception {
        String token = registerAndGetToken("asha@example.com");

        MvcResult created = mockMvc.perform(post("/api/profile/education")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EDUCATION_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.education.length()").value(1))
                .andExpect(jsonPath("$.education[0].institution").value("IIT Bombay"))
                .andExpect(jsonPath("$.completion.percentage").value(15))
                .andReturn();

        long id = readJson(created).get("education").get(0).get("id").asLong();

        mockMvc.perform(put("/api/profile/education/" + id)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EDUCATION_BODY.replace("B.Tech", "M.Tech")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.education[0].degree").value("M.Tech"));

        mockMvc.perform(delete("/api/profile/education/" + id).header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.education").isEmpty());
    }

    @Test
    void endDateBeforeStartDateReturns400WithFieldError() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        mockMvc.perform(post("/api/profile/experience")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"jobTitle":"Intern","company":"Acme","startDate":"2024-06-01",
                                 "endDate":"2024-01-01","currentlyWorking":false}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.endDate").exists());
    }

    @Test
    void currentJobIgnoresEndDate() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        mockMvc.perform(post("/api/profile/experience")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"jobTitle":"Developer","company":"Acme","startDate":"2024-06-01",
                                 "endDate":"2025-01-01","currentlyWorking":true}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.experience[0].currentlyWorking").value(true))
                .andExpect(jsonPath("$.experience[0].endDate").doesNotExist());
    }

    @Test
    void usersCannotEditEachOthersEntries() throws Exception {
        String ownerToken = registerAndGetToken("owner@example.com");
        String otherToken = registerAndGetToken("other@example.com");

        MvcResult created = mockMvc.perform(post("/api/profile/education")
                        .header("Authorization", bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EDUCATION_BODY))
                .andExpect(status().isCreated())
                .andReturn();
        long id = readJson(created).get("education").get(0).get("id").asLong();

        mockMvc.perform(delete("/api/profile/education/" + id).header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/profile").header("Authorization", bearer(ownerToken)))
                .andExpect(jsonPath("$.education.length()").value(1));
    }

    @Test
    void skillsAreReplacedAndDeduplicated() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        mockMvc.perform(put("/api/profile/skills")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"skills":[{"name":"React","level":"ADVANCED"},{"name":"react","level":"BEGINNER"},
                                           {"name":"Java","level":"INTERMEDIATE"},{"name":"MySQL","level":"EXPERT"}]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills.length()").value(3))
                .andExpect(jsonPath("$.completion.percentage").value(10));

        mockMvc.perform(put("/api/profile/skills")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"skills":[{"name":"Spring Boot","level":"ADVANCED"}]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills.length()").value(1))
                .andExpect(jsonPath("$.skills[0].name").value("Spring Boot"));
    }

    @Test
    void certificationExpiryBeforeIssueReturns400() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        mockMvc.perform(post("/api/profile/certifications")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"AWS Cloud Practitioner","issuer":"Amazon",
                                 "issueDate":"2025-01-01","expiryDate":"2024-01-01"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.expiryDate").exists());
    }

    @Test
    void profilePictureUploadServeAndDelete() throws Exception {
        String token = registerAndGetToken("asha@example.com");

        MvcResult uploaded = mockMvc.perform(multipart("/api/profile/picture")
                        .file(new MockMultipartFile("file", "me.png", "image/png", PNG_BYTES))
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personal.avatarPath").isNotEmpty())
                .andExpect(jsonPath("$.completion.percentage").value(10))
                .andReturn();

        String avatarPath = readJson(uploaded).get("personal").get("avatarPath").asText();
        assertThat(avatarPath).startsWith("/users/");

        // Public: no token needed
        mockMvc.perform(get("/api" + avatarPath))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(PNG_BYTES));

        // /users/me now includes the avatar too
        mockMvc.perform(get("/api/users/me").header("Authorization", bearer(token)))
                .andExpect(jsonPath("$.avatarPath").value(avatarPath));

        mockMvc.perform(delete("/api/profile/picture").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completion.percentage").value(0));

        mockMvc.perform(get("/api" + avatarPath)).andExpect(status().isNotFound());
    }

    @Test
    void nonImageUploadIsRejected() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        mockMvc.perform(multipart("/api/profile/picture")
                        .file(new MockMultipartFile("file", "evil.png", "image/png", "<script>".getBytes()))
                        .header("Authorization", bearer(token)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.file").exists());
    }

    // ------------------------------------------------------------ helpers

    private String registerAndGetToken(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Asha Verma","email":"%s","password":"secret123"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        return readJson(result).get("accessToken").asText();
    }

    private JsonNode readJson(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
