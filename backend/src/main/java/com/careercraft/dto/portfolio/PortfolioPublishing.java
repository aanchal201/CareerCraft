package com.careercraft.dto.portfolio;

import java.time.Instant;

/**
 * Publishing state shown in the editor.
 *
 * @param slug                  public address part, e.g. "asha-verma" (null until first publish)
 * @param published             is a public version live?
 * @param publishedAt           when it was last published
 * @param hasUnpublishedChanges the draft differs from the live version
 */
public record PortfolioPublishing(
        String slug,
        boolean published,
        Instant publishedAt,
        boolean hasUnpublishedChanges
) {
}
