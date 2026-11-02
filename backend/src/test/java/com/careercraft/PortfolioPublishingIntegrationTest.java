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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Publishing, public URLs and republishing (Phase 7).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PortfolioPublishingIntegrationTest {

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
    void publishedPortfolioIsPublicWithoutLogin() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        long id = createPortfolio(token);
        updateHeadline(token, id, "Frontend developer");

        mockMvc.perform(post("/api/portfolios/" + id + "/publish")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"Asha-Verma\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publishing.slug").value("asha-verma"))
                .andExpect(jsonPath("$.publishing.published").value(true))
                .andExpect(jsonPath("$.publishing.publishedAt").isNotEmpty())
                .andExpect(jsonPath("$.publishing.hasUnpublishedChanges").value(false));

        // no Authorization header
        mockMvc.perform(get("/api/public/portfolios/asha-verma"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("max-age=60")))
                .andExpect(jsonPath("$.slug").value("asha-verma"))
                .andExpect(jsonPath("$.content.hero.headline").value("Frontend developer"))
                .andExpect(jsonPath("$.templateId").value("minimal"))
                // no private fields
                .andExpect(jsonPath("$.id").doesNotExist())
                .andExpect(jsonPath("$.name").doesNotExist());
    }

    @Test
    void draftEditsStayPrivateUntilRepublished() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        long id = createPortfolio(token);
        updateHeadline(token, id, "Version one");
        publish(token, id, "asha");

        // edit the draft
        mockMvc.perform(put("/api/portfolios/" + id)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody("Version two")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publishing.hasUnpublishedChanges").value(true));

        mockMvc.perform(get("/api/public/portfolios/asha"))
                .andExpect(jsonPath("$.content.hero.headline").value("Version one"));

        // republish
        publish(token, id, "asha");
        mockMvc.perform(get("/api/public/portfolios/asha"))
                .andExpect(jsonPath("$.content.hero.headline").value("Version two"));
        mockMvc.perform(get("/api/portfolios/" + id).header("Authorization", bearer(token)))
                .andExpect(jsonPath("$.publishing.hasUnpublishedChanges").value(false));
    }

    @Test
    void addressRulesAndUniqueness() throws Exception {
        String owner = registerAndGetToken("owner@example.com");
        String other = registerAndGetToken("other@example.com");
        long ownerPortfolio = createPortfolio(owner);
        long otherPortfolio = createPortfolio(other);
        publish(owner, ownerPortfolio, "taken-name");

        // someone else can't use it
        mockMvc.perform(post("/api/portfolios/" + otherPortfolio + "/publish")
                        .header("Authorization", bearer(other))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"taken-name\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.fieldErrors.slug").exists());

        // availability endpoint
        mockMvc.perform(get("/api/portfolios/" + otherPortfolio + "/slug").param("value", "taken-name")
                        .header("Authorization", bearer(other)))
                .andExpect(jsonPath("$.available").value(false));
        mockMvc.perform(get("/api/portfolios/" + ownerPortfolio + "/slug").param("value", "taken-name")
                        .header("Authorization", bearer(owner)))
                .andExpect(jsonPath("$.available").value(true)); // it's already theirs

        // invalid / reserved
        for (String bad : new String[]{"ab", "-asha", "asha--v", "asha_v", "admin", "Has Space"}) {
            mockMvc.perform(post("/api/portfolios/" + otherPortfolio + "/publish")
                            .header("Authorization", bearer(other))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"slug\":\"" + bad + "\"}"))
                    .andExpect(status().isBadRequest());
        }

        // suggestion is based on the hero name and avoids taken addresses
        mockMvc.perform(get("/api/portfolios/" + otherPortfolio + "/slug").header("Authorization", bearer(other)))
                .andExpect(jsonPath("$.slug").value("asha-verma"))
                .andExpect(jsonPath("$.available").value(true));
    }

    @Test
    void unpublishAndDeleteTakeThePageDown() throws Exception {
        String token = registerAndGetToken("asha@example.com");
        long id = createPortfolio(token);
        publish(token, id, "asha-live");

        mockMvc.perform(post("/api/portfolios/" + id + "/unpublish").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publishing.published").value(false))
                .andExpect(jsonPath("$.publishing.slug").value("asha-live")); // still reserved
        mockMvc.perform(get("/api/public/portfolios/asha-live")).andExpect(status().isNotFound());

        publish(token, id, "asha-live");
        mockMvc.perform(get("/api/public/portfolios/asha-live")).andExpect(status().isOk());

        mockMvc.perform(delete("/api/portfolios/" + id).header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/public/portfolios/asha-live")).andExpect(status().isNotFound());
    }

    @Test
    void onlyTheOwnerCanPublish() throws Exception {
        String owner = registerAndGetToken("owner@example.com");
        String other = registerAndGetToken("other@example.com");
        long id = createPortfolio(owner);

        mockMvc.perform(post("/api/portfolios/" + id + "/publish")
                        .header("Authorization", bearer(other))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"hijack\"}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/portfolios/" + id + "/publish")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"hijack\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------ helpers

    private void publish(String token, long id, String slug) throws Exception {
        mockMvc.perform(post("/api/portfolios/" + id + "/publish")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"" + slug + "\"}"))
                .andExpect(status().isOk());
    }

    private void updateHeadline(String token, long id, String headline) throws Exception {
        mockMvc.perform(put("/api/portfolios/" + id)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody(headline)))
                .andExpect(status().isOk());
    }

    private static String updateBody(String headline) {
        return """
                {"name":"Main","templateId":"minimal","design":{},
                 "content":{"hero":{"name":"Asha Verma","headline":"%s","showAvatar":true},
                            "contact":{"email":"asha@example.com"}}}
                """.formatted(headline);
    }

    private long createPortfolio(String token) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/portfolios")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Main","templateId":"minimal","prefillFromProfile":false}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.publishing.published").value(false))
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
