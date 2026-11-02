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
 * End-to-end tests for the portfolio builder API (Phase 6).
 * Run with:  mvn test
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PortfolioControllerIntegrationTest {

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
    void portfoliosRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/portfolios")).andExpect(status().isUnauthorized());
    }

    @Test
    void blankPortfolioHasDefaultsAndAllSevenSections() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        mockMvc.perform(post("/api/portfolios")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"My Portfolio","templateId":"minimal","prefillFromProfile":false}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.templateId").value("minimal"))
                .andExpect(jsonPath("$.design.primaryColor").value("#0f766e"))
                .andExpect(jsonPath("$.design.colorMode").value("LIGHT"))
                .andExpect(jsonPath("$.design.fontPairing").value("modern"))
                .andExpect(jsonPath("$.content.hero.name").value("Asha Verma"))
                .andExpect(jsonPath("$.content.hero.ctaLabel").value("Get in touch"))
                .andExpect(jsonPath("$.content.contact.email").value("asha@example.com"))
                .andExpect(jsonPath("$.content.sections.length()").value(7))
                .andExpect(jsonPath("$.content.sections[0].key").value("about"));
    }

    @Test
    void portfolioCanBePrefilledFromProfile() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        mockMvc.perform(put("/api/profile/personal")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Asha Verma","headline":"Frontend developer","about":"I build web apps.",
                                 "location":"Mumbai","githubUrl":"https://github.com/asha"}
                                """))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/profile/skills")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"skills":[{"name":"React","level":"ADVANCED"},{"name":"Java","level":"INTERMEDIATE"}]}
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/portfolios")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Dev site","templateId":"bold","prefillFromProfile":true}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content.hero.headline").value("Frontend developer"))
                .andExpect(jsonPath("$.content.about.text").value("I build web apps."))
                .andExpect(jsonPath("$.content.about.location").value("Mumbai"))
                .andExpect(jsonPath("$.content.skills.length()").value(2))
                .andExpect(jsonPath("$.content.skills[0].id").isNotEmpty())
                .andExpect(jsonPath("$.content.contact.github").value("https://github.com/asha"));
    }

    @Test
    void updateSavesDesignAndContentAndNormalizes() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        long id = createPortfolio(token, "My Portfolio");

        mockMvc.perform(put("/api/portfolios/" + id)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Dark dev site","templateId":"sidebar",
                                 "design":{"primaryColor":"#7C3AED","colorMode":"DARK","fontPairing":"tech",
                                           "heroAlign":"","projectLayout":"LIST"},
                                 "content":{
                                   "hero":{"name":"Asha","headline":"Frontend developer","ctaLabel":"","showAvatar":false},
                                   "projects":[{"name":"CareerCraft","technologies":"React, Spring Boot",
                                                "repoUrl":"https://github.com/asha/careercraft","featured":true}],
                                   "sections":[{"key":"projects","title":"Selected Work","visible":true},
                                               {"key":"evil","title":"x","visible":true}]
                                 }}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Dark dev site"))
                .andExpect(jsonPath("$.templateId").value("sidebar"))
                .andExpect(jsonPath("$.design.primaryColor").value("#7c3aed"))
                .andExpect(jsonPath("$.design.colorMode").value("DARK"))
                .andExpect(jsonPath("$.design.heroAlign").value("LEFT"))
                .andExpect(jsonPath("$.design.projectLayout").value("LIST"))
                .andExpect(jsonPath("$.content.hero.ctaLabel").value("Get in touch"))
                .andExpect(jsonPath("$.content.projects[0].id").isNotEmpty())
                .andExpect(jsonPath("$.content.sections.length()").value(7))
                .andExpect(jsonPath("$.content.sections[0].key").value("projects"))
                .andExpect(jsonPath("$.content.sections[0].title").value("Selected Work"));

        mockMvc.perform(get("/api/portfolios").header("Authorization", bearer(token)))
                .andExpect(jsonPath("$[0].primaryColor").value("#7c3aed"))
                .andExpect(jsonPath("$[0].colorMode").value("DARK"))
                .andExpect(jsonPath("$[0].content").doesNotExist());
    }

    @Test
    void invalidTemplateDesignAndUrlsReturn400() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        mockMvc.perform(post("/api/portfolios")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"X","templateId":"neon","prefillFromProfile":false}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.templateId").exists());

        long id = createPortfolio(token, "My Portfolio");
        mockMvc.perform(put("/api/portfolios/" + id)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"X","templateId":"minimal",
                                 "design":{"primaryColor":"purple","fontPairing":"comic-sans"},
                                 "content":{"projects":[{"name":"P","liveUrl":"my-site.com"}]}}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors['design.primaryColor']").exists())
                .andExpect(jsonPath("$.fieldErrors['design.fontPairing']").exists())
                .andExpect(jsonPath("$.fieldErrors['content.projects[0].liveUrl']").exists());
    }

    @Test
    void duplicateDeleteAndOwnership() throws Exception {
        String ownerToken = registerAndGetToken("owner@example.com");
        String otherToken = registerAndGetToken("other@example.com");
        long id = createPortfolio(ownerToken, "Main");

        mockMvc.perform(post("/api/portfolios/" + id + "/duplicate").header("Authorization", bearer(ownerToken)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Main (copy)"));

        mockMvc.perform(get("/api/portfolios/" + id).header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/portfolios/" + id).header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/portfolios/" + id).header("Authorization", bearer(ownerToken)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/portfolios").header("Authorization", bearer(ownerToken)))
                .andExpect(jsonPath("$.length()").value(1));
    }

    // ------------------------------------------------------------ helpers

    private long createPortfolio(String token, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/portfolios")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"%s","templateId":"minimal","prefillFromProfile":false}
                                """.formatted(name)))
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
