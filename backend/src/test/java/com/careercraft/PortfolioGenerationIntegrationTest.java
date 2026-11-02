package com.careercraft;

import com.careercraft.ai.GrokClient;
import com.careercraft.dto.portfolio.PortfolioAiContent;
import com.careercraft.dto.portfolio.PortfolioAiContent.ProjectDescription;
import com.careercraft.dto.portfolio.PortfolioAiContent.SkillGroup;
import com.careercraft.support.DatabaseCleaner;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Generating portfolios from resumes, with and without AI (Phase 7).
 * Grok is mocked - no real API calls. AI limit lowered to 2 for the limit test.
 */
@SpringBootTest(properties = "app.ai.portfolio-daily-limit=2")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PortfolioGenerationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DatabaseCleaner databaseCleaner;

    @MockitoBean
    private GrokClient grokClient;

    @BeforeEach
    void setUp() {
        databaseCleaner.clean();
        when(grokClient.isConfigured()).thenReturn(true);
        when(grokClient.modelName()).thenReturn("grok-test");
        when(grokClient.generateStructured(anyString(), anyString(), anyString(), anyMap(), eq(PortfolioAiContent.class)))
                .thenReturn(new PortfolioAiContent(
                        "Frontend developer",
                        "I build fast, accessible React apps.",
                        "I'm a developer who loves clean UI.\n\nI recently interned at Acme.",
                        "Let's build something great together.",
                        List.of(new SkillGroup("Frontend", List.of("react", "Kubernetes")), // "Kubernetes" is invented
                                new SkillGroup("Backend", List.of("Java"))),
                        List.of(new ProjectDescription("careercraft", "An AI resume builder made with React."),
                                new ProjectDescription("Invented Project", "Should be ignored."))));
    }

    @Test
    void generatesFromResumeWithoutAi() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        long resumeId = createResume(token);

        mockMvc.perform(post("/api/portfolios/generate")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"From resume","templateId":"bold","resumeId":%d,"useAi":false}
                                """.formatted(resumeId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.templateId").value("bold"))
                .andExpect(jsonPath("$.content.hero.name").value("Asha Verma"))
                .andExpect(jsonPath("$.content.hero.headline").value("Software Engineer"))
                .andExpect(jsonPath("$.content.about.text").value("Developer who builds web apps."))
                .andExpect(jsonPath("$.content.skills.length()").value(2))
                .andExpect(jsonPath("$.content.projects[0].name").value("CareerCraft"))
                .andExpect(jsonPath("$.content.projects[0].repoUrl").value("https://github.com/asha/careercraft"))
                .andExpect(jsonPath("$.content.projects[0].featured").value(true))
                .andExpect(jsonPath("$.content.experience[0].company").value("Acme"))
                .andExpect(jsonPath("$.content.contact.email").value("asha@example.com"));

        verify(grokClient, never()).generateStructured(anyString(), anyString(), anyString(), anyMap(),
                eq(PortfolioAiContent.class));
    }

    @Test
    void generatesWithAiButNeverInventsSkillsOrProjects() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        long resumeId = createResume(token);

        mockMvc.perform(post("/api/portfolios/generate")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"AI portfolio","templateId":"minimal","resumeId":%d,"useAi":true,"tone":"FRIENDLY"}
                                """.formatted(resumeId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content.hero.tagline").value("I build fast, accessible React apps."))
                .andExpect(jsonPath("$.content.contact.message").value("Let's build something great together."))
                // still exactly the 2 real skills, now grouped (original spelling kept)
                .andExpect(jsonPath("$.content.skills.length()").value(2))
                .andExpect(jsonPath("$.content.skills[?(@.name=='React')].category").value("Frontend"))
                .andExpect(jsonPath("$.content.skills[?(@.name=='Java')].category").value("Backend"))
                // only the real project, with the polished description
                .andExpect(jsonPath("$.content.projects.length()").value(1))
                .andExpect(jsonPath("$.content.projects[0].description").value("An AI resume builder made with React."));

        mockMvc.perform(get("/api/portfolios/ai/status").header("Authorization", bearer(token)))
                .andExpect(jsonPath("$.aiConfigured").value(true))
                .andExpect(jsonPath("$.remainingToday").value(1));
    }

    @Test
    void writeWithAiReturnsSuggestionsWithoutSaving() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        long resumeId = createResume(token);
        MvcResult created = mockMvc.perform(post("/api/portfolios/generate")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Plain","templateId":"minimal","resumeId":%d,"useAi":false}
                                """.formatted(resumeId)))
                .andExpect(status().isCreated())
                .andReturn();
        long portfolioId = readJson(created).get("id").asLong();

        mockMvc.perform(post("/api/portfolios/" + portfolioId + "/ai/write")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tone\":\"BOLD\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headline").value("Frontend developer"))
                .andExpect(jsonPath("$.skillGroups[0].skills[0]").value("React"))
                .andExpect(jsonPath("$.projectDescriptions.length()").value(1));

        // nothing changed on the server
        mockMvc.perform(get("/api/portfolios/" + portfolioId).header("Authorization", bearer(token)))
                .andExpect(jsonPath("$.content.hero.tagline").doesNotExist());
    }

    @Test
    void aiRulesLimitsAndOwnership() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        String otherToken = registerAndGetToken("other@example.com");
        long resumeId = createResume(token);
        String aiBody = """
                {"name":"AI","templateId":"minimal","resumeId":%d,"useAi":true}
                """.formatted(resumeId);

        // someone else's resume -> 404
        mockMvc.perform(post("/api/portfolios/generate")
                        .header("Authorization", bearer(otherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(aiBody))
                .andExpect(status().isNotFound());

        // daily limit (2)
        for (int i = 0; i < 2; i++) {
            mockMvc.perform(post("/api/portfolios/generate").header("Authorization", bearer(token))
                            .contentType(MediaType.APPLICATION_JSON).content(aiBody))
                    .andExpect(status().isCreated());
        }
        mockMvc.perform(post("/api/portfolios/generate").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(aiBody))
                .andExpect(status().isTooManyRequests());

        // without a key -> 503, but the non-AI path still works
        when(grokClient.isConfigured()).thenReturn(false);
        mockMvc.perform(post("/api/portfolios/generate").header("Authorization", bearer(otherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"AI","templateId":"minimal","resumeId":%d,"useAi":true}
                                """.formatted(createResume(otherToken))))
                .andExpect(status().isServiceUnavailable());
    }

    // ------------------------------------------------------------ helpers

    private long createResume(String token) throws Exception {
        MvcResult created = mockMvc.perform(post("/api/resumes")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"SDE","templateId":"classic","prefillFromProfile":false}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        long id = readJson(created).get("id").asLong();

        mockMvc.perform(put("/api/resumes/" + id)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"SDE","templateId":"classic","accentColor":"#0f766e",
                                 "content":{
                                   "personal":{"fullName":"Asha Verma","jobTitle":"Software Engineer","email":"asha@example.com",
                                               "location":"Mumbai","github":"https://github.com/asha"},
                                   "summary":"Developer who builds web apps.",
                                   "experience":[{"jobTitle":"Intern","company":"Acme","startDate":"2024-06","endDate":"2024-08",
                                                  "current":false,"description":"Built React components"}],
                                   "skills":[{"name":"React","level":"ADVANCED"},{"name":"Java","level":"INTERMEDIATE"}],
                                   "projects":[{"name":"CareerCraft","technologies":"React, Spring Boot",
                                                "link":"https://github.com/asha/careercraft","description":"Resume builder"}]
                                 }}
                                """))
                .andExpect(status().isOk());
        return id;
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
