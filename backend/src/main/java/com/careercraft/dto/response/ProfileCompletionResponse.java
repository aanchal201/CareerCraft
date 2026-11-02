package com.careercraft.dto.response;

import java.util.List;

/**
 * Profile completion summary.
 *
 * @param percentage 0-100
 * @param items      every checklist item, so the UI can show what's missing
 *                   and link to the right profile tab (section)
 */
public record ProfileCompletionResponse(
        int percentage,
        List<Item> items
) {
    public record Item(
            String key,
            String label,
            String section,
            int weight,
            boolean completed
    ) {
    }
}
