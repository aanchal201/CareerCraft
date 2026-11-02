package com.careercraft;

import com.careercraft.ai.GrokClient;
import com.careercraft.dto.analysis.AiAnalysis;
import com.careercraft.support.DatabaseCleaner;
import com.careercraft.support.TestPdfs;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end tests for the resume analyzer (Phase 5).
 *
 * GrokClient is replaced by a Mockito mock (@MockitoBean), so these tests
 * never call the real AI API, cost nothing, and need no API key.
 * daily-limit is lowered to 3 to test the limit quickly.
 */
@SpringBootTest(properties = "app.ai.daily-limit=3")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ResumeAnalysisControllerIntegrationTest {

    private static final String JOB_DESCRIPTION = """
            We are hiring a Frontend Developer to build React applications. Required: React, TypeScript,
            REST APIs, testing with Jest. Preferred: Next.js and accessibility experience.
            """;

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
        when(grokClient.generateStructured(anyString(), anyString(), anyString(), anyMap(), eq(AiAnalysis.class)))
                .thenReturn(sampleAnalysis(true));
    }

    @Test
    void analysisRequiresAuthentication() throws Exception {
        mockMvc.perform(multipart("/api/analyses").param("resumeId", "1")).andExpect(status().isUnauthorized());
    }

    @Test
    void analyzesAnUploadedPdfWithAJobDescription() throws Exception {
        String token = registerAndGetToken("asha@example.com");

        mockMvc.perform(multipart("/api/analyses")
                        .file(pdf("asha-resume.pdf", TestPdfs.sampleResume()))
                        .param("jobDescription", JOB_DESCRIPTION)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.sourceType").value("UPLOAD"))
                .andExpect(jsonPath("$.sourceName").value("asha-resume.pdf"))
                .andExpect(jsonPath("$.aiScore").value(80))
                .andExpect(jsonPath("$.matchScore").value(72))
                .andExpect(jsonPath("$.jobTitle").value("Frontend Developer"))
                .andExpect(jsonPath("$.ai.improvements[0].priority").value("HIGH"))
                .andExpect(jsonPath("$.atsChecks.length()").value(9))
                .andExpect(jsonPath("$.model").value("grok-test"));

        // the prompt contained the extracted resume text and the job description, wrapped in tags
        ArgumentCaptor<String> userContent = ArgumentCaptor.forClass(String.class);
        verify(grokClient).generateStructured(anyString(), userContent.capture(), anyString(), anyMap(),
                eq(AiAnalysis.class));
        assertThat(userContent.getValue())
                .contains("<resume>").contains("Asha Verma")
                .contains("<job_description>").contains("TypeScript");
    }

    @Test
    void finalScoreBlendsAiScoreAndRuleBasedChecks() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        MvcResult result = mockMvc.perform(multipart("/api/analyses")
                        .file(pdf("resume.pdf", TestPdfs.sampleResume()))
                        .header("Authorization", bearer(token)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = readJson(result);
        int expected = (int) Math.round(json.get("aiScore").asInt() * 0.7 + json.get("checksScore").asInt() * 0.3);
        assertThat(json.get("atsScore").asInt()).isEqualTo(expected);
        // no job description -> no match section
        assertThat(json.get("matchScore").isNull()).isTrue();
    }

    @Test
    void analyzesASavedResume() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        long resumeId = createFilledResume(token);

        mockMvc.perform(multipart("/api/analyses")
                        .param("resumeId", String.valueOf(resumeId))
                        .header("Authorization", bearer(token)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sourceType").value("SAVED_RESUME"))
                .andExpect(jsonPath("$.sourceName").value("Frontend Resume"))
                .andExpect(jsonPath("$.resumeId").value(resumeId));
    }

    @Test
    void invalidInputIsRejectedBeforeCallingTheAi() throws Exception {
        String token = registerAndGetToken("asha@example.com");

        // neither file nor resumeId
        mockMvc.perform(multipart("/api/analyses").header("Authorization", bearer(token)))
                .andExpect(status().isBadRequest());

        // not a PDF
        mockMvc.perform(multipart("/api/analyses")
                        .file(new MockMultipartFile("file", "resume.pdf", "application/pdf", "hello".getBytes()))
                        .header("Authorization", bearer(token)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.file").exists());

        // job description too short
        mockMvc.perform(multipart("/api/analyses")
                        .file(pdf("resume.pdf", TestPdfs.sampleResume()))
                        .param("jobDescription", "React dev")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.jobDescription").exists());

        // someone else's / unknown resume
        mockMvc.perform(multipart("/api/analyses").param("resumeId", "999999").header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());

        verify(grokClient, never()).generateStructured(anyString(), anyString(), anyString(), anyMap(),
                eq(AiAnalysis.class));
    }

    @Test
    void missingApiKeyReturns503() throws Exception {
        when(grokClient.isConfigured()).thenReturn(false);
        String token = registerAndGetToken("asha@example.com");

        mockMvc.perform(multipart("/api/analyses")
                        .file(pdf("resume.pdf", TestPdfs.sampleResume()))
                        .header("Authorization", bearer(token)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("GROK_API_KEY")));

        mockMvc.perform(get("/api/analyses/status").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aiConfigured").value(false));
    }

    @Test
    void historyOwnershipAndDelete() throws Exception {
        String ownerToken = registerAndGetToken("owner@example.com");
        String otherToken = registerAndGetToken("other@example.com");

        MvcResult created = mockMvc.perform(multipart("/api/analyses")
                        .file(pdf("resume.pdf", TestPdfs.sampleResume()))
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isCreated())
                .andReturn();
        long id = readJson(created).get("id").asLong();

        mockMvc.perform(get("/api/analyses").header("Authorization", bearer(ownerToken)))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].sourceName").value("resume.pdf"));

        mockMvc.perform(get("/api/analyses/" + id).header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/analyses/" + id).header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/analyses/" + id).header("Authorization", bearer(ownerToken)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/analyses/" + id).header("Authorization", bearer(ownerToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void dailyLimitReturns429() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(multipart("/api/analyses")
                            .file(pdf("resume.pdf", TestPdfs.sampleResume()))
                            .header("Authorization", bearer(token)))
                    .andExpect(status().isCreated());
        }
        mockMvc.perform(multipart("/api/analyses")
                        .file(pdf("resume.pdf", TestPdfs.sampleResume()))
                        .header("Authorization", bearer(token)))
                .andExpect(status().isTooManyRequests());

        mockMvc.perform(get("/api/analyses/status").header("Authorization", bearer(token)))
                .andExpect(jsonPath("$.remainingToday").value(0));
    }

    // ------------------------------------------------------------ helpers

    private static AiAnalysis sampleAnalysis(boolean withJob) {
        AiAnalysis.JobMatch match = withJob ? new AiAnalysis.JobMatch(72, "Frontend Developer",
                "Good fit for the core React work; TypeScript and testing are missing.",
                List.of("React", "REST APIs"),
                List.of(new AiAnalysis.MissingKeyword("TypeScript", "REQUIRED", "Add it to Skills if you use it.")),
                List.of("Add a TypeScript project")) : null;
        return new AiAnalysis(
                80,
                "A solid early-career resume with clear impact.",
                List.of(new AiAnalysis.ScoreItem("Impact & achievements", 78, "Good use of numbers.")),
                List.of("Quantified achievements"),
                List.of(new AiAnalysis.Improvement("HIGH", "Summary", "No summary.", "Add a 2-line summary.",
                        "Frontend developer who builds fast React apps.")),
                List.of("React", "Java"),
                new AiAnalysis.ExperienceInsight(0.5, "ENTRY", List.of("Internship at Acme")),
                match);
    }

    private long createFilledResume(String token) throws Exception {
        MvcResult created = mockMvc.perform(post("/api/resumes")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Frontend Resume","templateId":"classic","prefillFromProfile":false}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        long id = readJson(created).get("id").asLong();

        mockMvc.perform(put("/api/resumes/" + id)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Frontend Resume","templateId":"classic","accentColor":"#0f766e",
                                 "content":{
                                   "personal":{"fullName":"Asha Verma","email":"asha@example.com","phone":"+91 98765 43210"},
                                   "summary":"Frontend developer who builds fast, accessible React applications.",
                                   "experience":[{"jobTitle":"Software Engineering Intern","company":"Acme","startDate":"2024-06",
                                     "endDate":"2024-08","current":false,
                                     "description":"Built 12 React components used by 5000 users\\nReduced load time by 30%"}],
                                   "skills":[{"name":"React","level":"ADVANCED"},{"name":"Java","level":"INTERMEDIATE"}]
                                 }}
                                """))
                .andExpect(status().isOk());
        return id;
    }

    private static MockMultipartFile pdf(String name, byte[] bytes) {
        return new MockMultipartFile("file", name, "application/pdf", bytes);
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
