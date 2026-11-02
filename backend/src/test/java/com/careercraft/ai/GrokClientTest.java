package com.careercraft.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withUnauthorizedRequest;

/**
 * Unit tests for GrokClient against a fake HTTP server (no real API calls).
 */
class GrokClientTest {

    private static final String BASE_URL = "https://api.x.ai/v1";
    private static final Map<String, Object> SCHEMA = Map.of("type", "object");

    record Answer(String verdict, int score) {
    }

    private MockRestServiceServer server;
    private GrokClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
        server = MockRestServiceServer.bindTo(builder).build();
        GrokProperties properties = new GrokProperties("test-key", BASE_URL, "grok-4.7", "low", 30);
        client = new GrokClient(builder.build(), properties, new ObjectMapper());
    }

    @Test
    void sendsResponsesRequestAndParsesStructuredOutput() {
        String response = """
                {"id":"r1","object":"response","status":"completed",
                 "output":[
                   {"type":"reasoning","summary":[]},
                   {"type":"message","role":"assistant","content":[
                     {"type":"output_text","text":"{\\"verdict\\":\\"good\\",\\"score\\":80}"}]}
                 ],
                 "usage":{"input_tokens":120,"output_tokens":30}}
                """;

        server.expect(requestTo(BASE_URL + "/responses"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-key"))
                .andExpect(jsonPath("$.model").value("grok-4.7"))
                .andExpect(jsonPath("$.input[0].role").value("system"))
                .andExpect(jsonPath("$.input[1].role").value("user"))
                .andExpect(jsonPath("$.text.format.type").value("json_schema"))
                .andExpect(jsonPath("$.text.format.strict").value(true))
                .andExpect(jsonPath("$.reasoning.effort").value("low"))
                .andExpect(jsonPath("$.store").value(false))
                .andRespond(withSuccess(response, MediaType.APPLICATION_JSON));

        Answer answer = client.generateStructured("instructions", "content", "answer", SCHEMA, Answer.class);

        assertThat(answer.verdict()).isEqualTo("good");
        assertThat(answer.score()).isEqualTo(80);
        server.verify();
    }

    @Test
    void invalidApiKeyBecomesBadGatewayWithFriendlyMessage() {
        server.expect(requestTo(BASE_URL + "/responses")).andRespond(withUnauthorizedRequest());

        assertThatThrownBy(() -> client.generateStructured("i", "c", "answer", SCHEMA, Answer.class))
                .isInstanceOf(AiServiceException.class)
                .hasMessageContaining("API key")
                .extracting(ex -> ((AiServiceException) ex).getStatus())
                .isEqualTo(HttpStatus.BAD_GATEWAY);
    }

    @Test
    void rateLimitBecomesServiceUnavailable() {
        server.expect(requestTo(BASE_URL + "/responses")).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

        assertThatThrownBy(() -> client.generateStructured("i", "c", "answer", SCHEMA, Answer.class))
                .isInstanceOf(AiServiceException.class)
                .extracting(ex -> ((AiServiceException) ex).getStatus())
                .isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Test
    void missingApiKeyFailsWithoutCallingTheApi() {
        GrokClient unconfigured = new GrokClient(RestClient.builder().build(),
                new GrokProperties("", BASE_URL, "grok-4.7", "low", 30), new ObjectMapper());

        assertThat(unconfigured.isConfigured()).isFalse();
        assertThatThrownBy(() -> unconfigured.generateStructured("i", "c", "answer", SCHEMA, Answer.class))
                .isInstanceOf(AiServiceException.class)
                .extracting(ex -> ((AiServiceException) ex).getStatus())
                .isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
    }
}
