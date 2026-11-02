package com.careercraft;

import com.careercraft.support.DatabaseCleaner;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end tests for the resume builder API (Phase 3).
 * Run with:  mvn test
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ResumeControllerIntegrationTest {

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
    void resumesRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/resumes")).andExpect(status().isUnauthorized());
    }

    @Test
    void blankResumeHasNameEmailAndAllEightSections() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        mockMvc.perform(post("/api/resumes")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Frontend Developer","templateId":"classic","prefillFromProfile":false}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.templateId").value("classic"))
                .andExpect(jsonPath("$.accentColor").value("#0f766e"))
                .andExpect(jsonPath("$.content.personal.fullName").value("Asha Verma"))
                .andExpect(jsonPath("$.content.personal.email").value("asha@example.com"))
                .andExpect(jsonPath("$.content.experience").isEmpty())
                .andExpect(jsonPath("$.content.sections.length()").value(8))
                .andExpect(jsonPath("$.content.sections[0].key").value("summary"));
    }

    @Test
    void resumeCanBePrefilledFromProfile() throws Exception {
        String token = registerAndGetToken("asha@example.com");

        mockMvc.perform(put("/api/profile/personal")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Asha Verma","headline":"Full-stack developer","about":"I build web apps."}
                                """))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/profile/education")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"institution":"IIT Bombay","degree":"B.Tech","startDate":"2020-08-01",
                                 "endDate":"2024-05-01","currentlyStudying":false}
                                """))
                .andExpect(status().isCreated());
        mockMvc.perform(put("/api/profile/skills")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"skills":[{"name":"React","level":"ADVANCED"}]}
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/resumes")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"SDE Resume","templateId":"modern","prefillFromProfile":true}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content.personal.jobTitle").value("Full-stack developer"))
                .andExpect(jsonPath("$.content.summary").value("I build web apps."))
                .andExpect(jsonPath("$.content.education[0].institution").value("IIT Bombay"))
                .andExpect(jsonPath("$.content.education[0].startDate").value("2020-08"))
                .andExpect(jsonPath("$.content.education[0].id").isNotEmpty())
                .andExpect(jsonPath("$.content.skills[0].name").value("React"));
    }

    @Test
    void updateSavesContentAndNormalizesSections() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        long id = createResume(token, "My Resume");

        mockMvc.perform(put("/api/resumes/" + id)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Backend Engineer","templateId":"minimal","accentColor":"#1E3A8A",
                                 "content":{
                                   "personal":{"fullName":"Asha Verma","jobTitle":"Backend Engineer"},
                                   "summary":"  Java developer.  ",
                                   "experience":[{"jobTitle":"Intern","company":"Acme","startDate":"2024-06",
                                                  "endDate":"2024-08","current":false,"description":"Built APIs"}],
                                   "sections":[{"key":"experience","title":"Experience","visible":true},
                                               {"key":"summary","title":"","visible":false},
                                               {"key":"bogus","title":"Hack","visible":true}]
                                 }}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Backend Engineer"))
                .andExpect(jsonPath("$.templateId").value("minimal"))
                .andExpect(jsonPath("$.accentColor").value("#1e3a8a"))
                .andExpect(jsonPath("$.content.summary").value("Java developer."))
                .andExpect(jsonPath("$.content.experience[0].id").isNotEmpty())
                // user's order kept, unknown key dropped, missing keys appended, blank title defaulted
                .andExpect(jsonPath("$.content.sections.length()").value(8))
                .andExpect(jsonPath("$.content.sections[0].key").value("experience"))
                .andExpect(jsonPath("$.content.sections[1].key").value("summary"))
                .andExpect(jsonPath("$.content.sections[1].title").value("Professional Summary"))
                .andExpect(jsonPath("$.content.sections[1].visible").value(false));

        mockMvc.perform(get("/api/resumes/" + id).header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.experience[0].company").value("Acme"));
    }

    @Test
    void invalidTemplateAccentAndDatesReturn400() throws Exception {
        String token = registerAndGetToken("asha@example.com");

        mockMvc.perform(post("/api/resumes")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"X","templateId":"fancy","prefillFromProfile":false}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.templateId").exists());

        long id = createResume(token, "My Resume");
        mockMvc.perform(put("/api/resumes/" + id)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"X","templateId":"classic","accentColor":"red",
                                 "content":{"experience":[{"startDate":"June 2024"}]}}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.accentColor").exists())
                .andExpect(jsonPath("$.fieldErrors['content.experience[0].startDate']").exists());
    }

    @Test
    void listDuplicateAndDelete() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        long id = createResume(token, "Data Analyst");

        mockMvc.perform(post("/api/resumes/" + id + "/duplicate").header("Authorization", bearer(token)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Data Analyst (copy)"));

        mockMvc.perform(get("/api/resumes").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].content").doesNotExist());

        mockMvc.perform(delete("/api/resumes/" + id).header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/resumes/" + id).header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/resumes").header("Authorization", bearer(token)))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void usersCannotAccessEachOthersResumes() throws Exception {
        String ownerToken = registerAndGetToken("owner@example.com");
        String otherToken = registerAndGetToken("other@example.com");
        long id = createResume(ownerToken, "Private");

        mockMvc.perform(get("/api/resumes/" + id).header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/resumes/" + id).header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());

        ObjectNode body = objectMapper.createObjectNode();
        body.put("title", "Hacked");
        body.put("templateId", "classic");
        body.put("accentColor", "#000000");
        body.putObject("content");
        mockMvc.perform(put("/api/resumes/" + id)
                        .header("Authorization", bearer(otherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.toString()))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/resumes").header("Authorization", bearer(otherToken)))
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ------------------------------------------------------------ helpers

    private long createResume(String token, String title) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/resumes")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"%s","templateId":"classic","prefillFromProfile":false}
                                """.formatted(title)))
                .andExpect(status().isCreated())
                .andReturn();
        return readJson(result).get("id").asLong();
    }

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
