package com.careercraft.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Minimal client for the xAI (Grok) Responses API:
 *   POST {baseUrl}/responses
 *
 * It asks for "structured output": we send a JSON Schema and Grok must answer
 * with JSON that matches it, which we then map onto a Java record. That makes
 * the AI's answer safe to use in code (no fragile text parsing).
 *
 * Request body:
 * {
 *   "model": "grok-4.7",
 *   "input": [ {"role":"system","content":"..."}, {"role":"user","content":"..."} ],
 *   "text": { "format": { "type":"json_schema", "name":"...", "schema":{...}, "strict":true } },
 *   "reasoning": { "effort": "low" },
 *   "store": false
 * }
 *
 * The answer text is at output[type=message].content[type=output_text].text
 */
@Component
public class GrokClient {

    private static final Logger log = LoggerFactory.getLogger(GrokClient.class);

    private final RestClient restClient;
    private final GrokProperties properties;
    private final ObjectMapper objectMapper;

    public GrokClient(@Qualifier("grokRestClient") RestClient restClient,
                      GrokProperties properties,
                      ObjectMapper objectMapper) {
        this.restClient = restClient;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return properties.isConfigured();
    }

    public String modelName() {
        return properties.model();
    }

    /**
     * Sends a prompt and returns Grok's JSON answer mapped onto {@code type}.
     *
     * @param instructions system message: role, rules, output expectations
     * @param userContent  the data to work on (resume text, job description...)
     * @param schemaName   short name for the JSON schema
     * @param schema       JSON Schema (as nested Maps/Lists) the answer must follow
     */
    public <T> T generateStructured(String instructions, String userContent, String schemaName,
                                    Map<String, Object> schema, Class<T> type) {
        if (!properties.isConfigured()) {
            throw AiServiceException.notConfigured();
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.model());
        body.put("input", List.of(
                Map.of("role", "system", "content", instructions),
                Map.of("role", "user", "content", userContent)
        ));
        body.put("text", Map.of("format", Map.of(
                "type", "json_schema",
                "name", schemaName,
                "schema", schema,
                "strict", true
        )));
        if (properties.reasoningEffort() != null && !properties.reasoningEffort().isBlank()) {
            body.put("reasoning", Map.of("effort", properties.reasoningEffort().trim()));
        }
        body.put("store", false); // don't keep resumes on the provider's side

        JsonNode response = send(body);
        logUsage(response);
        String json = extractOutputText(response);

        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException ex) {
            log.warn("Grok returned JSON that doesn't match {}: {}", type.getSimpleName(), ex.getOriginalMessage());
            throw new AiServiceException("The AI returned an unexpected answer. Please try again.",
                    HttpStatus.BAD_GATEWAY, ex);
        }
    }

    private JsonNode send(Map<String, Object> body) {
        try {
            JsonNode response = restClient.post()
                    .uri("/responses")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.apiKey().trim())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            if (response == null) {
                throw new AiServiceException("The AI service returned an empty response.", HttpStatus.BAD_GATEWAY);
            }
            return response;
        } catch (HttpClientErrorException.Unauthorized | HttpClientErrorException.Forbidden ex) {
            log.error("Grok rejected the API key (HTTP {})", ex.getStatusCode().value());
            throw new AiServiceException("The AI service rejected the API key. Check GROK_API_KEY on the server.",
                    HttpStatus.BAD_GATEWAY, ex);
        } catch (HttpClientErrorException.TooManyRequests ex) {
            throw new AiServiceException("The AI service is busy right now. Please try again in a minute.",
                    HttpStatus.SERVICE_UNAVAILABLE, ex);
        } catch (HttpClientErrorException ex) {
            // 400/404/422: usually a wrong model name or an invalid request. Log details for the developer.
            log.error("Grok request failed: HTTP {} - {}", ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new AiServiceException("The AI service could not process this request. "
                    + "Check GROK_MODEL on the server.", HttpStatus.BAD_GATEWAY, ex);
        } catch (HttpServerErrorException ex) {
            log.error("Grok server error: HTTP {}", ex.getStatusCode().value());
            throw new AiServiceException("The AI service is having problems. Please try again later.",
                    HttpStatus.BAD_GATEWAY, ex);
        } catch (ResourceAccessException ex) {
            log.error("Could not reach Grok: {}", ex.getMessage());
            throw new AiServiceException("The AI service took too long or could not be reached. Please try again.",
                    HttpStatus.GATEWAY_TIMEOUT, ex);
        }
    }

    /** Finds output[type=message].content[type=output_text].text */
    static String extractOutputText(JsonNode response) {
        JsonNode output = response.path("output");
        if (output.isArray()) {
            for (JsonNode item : output) {
                if (!"message".equals(item.path("type").asText())) continue;
                for (JsonNode part : item.path("content")) {
                    if ("output_text".equals(part.path("type").asText()) && part.hasNonNull("text")) {
                        return part.get("text").asText();
                    }
                    if ("refusal".equals(part.path("type").asText())) {
                        throw new AiServiceException("The AI declined to analyze this content.",
                                HttpStatus.UNPROCESSABLE_ENTITY);
                    }
                }
            }
        }
        // some OpenAI-compatible APIs also expose a convenience field
        if (response.hasNonNull("output_text")) {
            return response.get("output_text").asText();
        }
        throw new AiServiceException("The AI returned no answer. Please try again.", HttpStatus.BAD_GATEWAY);
    }

    private void logUsage(JsonNode response) {
        JsonNode usage = response.path("usage");
        if (!usage.isMissingNode()) {
            log.info("Grok usage - input tokens: {}, output tokens: {}",
                    usage.path("input_tokens").asText("?"), usage.path("output_tokens").asText("?"));
        }
    }
}
