package com.careercraft.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Grok (xAI) settings, bound from app.ai.grok.* in application.yml
 * (which reads GROK_* environment variables).
 *
 * @param apiKey          secret key - only ever used on the server
 * @param baseUrl         e.g. https://api.x.ai/v1
 * @param model           e.g. grok-4.7
 * @param reasoningEffort low | medium | high | xhigh, or empty for the model default
 * @param timeoutSeconds  how long to wait for an answer
 */
@ConfigurationProperties(prefix = "app.ai.grok")
public record GrokProperties(
        String apiKey,
        String baseUrl,
        String model,
        String reasoningEffort,
        int timeoutSeconds
) {
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && model != null && !model.isBlank();
    }
}
