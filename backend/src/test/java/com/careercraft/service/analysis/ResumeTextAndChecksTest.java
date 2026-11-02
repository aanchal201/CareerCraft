package com.careercraft.service.analysis;

import com.careercraft.dto.analysis.AtsCheck;
import com.careercraft.exception.InvalidRequestException;
import com.careercraft.support.TestPdfs;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Plain unit tests (no Spring) for PDF text extraction and the rule-based ATS checks.
 */
class ResumeTextAndChecksTest {

    private final ResumeTextExtractor extractor = new ResumeTextExtractor();
    private final LocalAtsChecker checker = new LocalAtsChecker();

    @Test
    void extractsTextFromATextBasedPdf() {
        String text = extractor.extract(TestPdfs.sampleResume());
        assertThat(text).contains("Asha Verma").contains("Spring Boot").contains("30%");
    }

    @Test
    void rejectsFilesThatAreNotPdfs() {
        assertThatThrownBy(() -> extractor.extract("<html>not a pdf</html>".getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("Only PDF");
    }

    @Test
    void rejectsPdfsWithoutEnoughText() {
        assertThatThrownBy(() -> extractor.extract(TestPdfs.withLines("Hello")))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("readable text");
    }

    @Test
    void ruleBasedChecksRecognizeAGoodResume() {
        String text = extractor.extract(TestPdfs.sampleResume());
        Map<String, Boolean> results = checker.check(text).stream()
                .collect(Collectors.toMap(AtsCheck::key, AtsCheck::passed));

        assertThat(results).containsEntry("email", true)
                .containsEntry("phone", true)
                .containsEntry("links", true)
                .containsEntry("sections", true)
                .containsEntry("metrics", true)
                .containsEntry("bullets", true)
                .containsEntry("dates", true)
                .containsEntry("tone", true)
                // the sample is short, so the length check should fail
                .containsEntry("length", false);
    }

    @Test
    void dateRangesAreNotMistakenForPhoneNumbers() {
        List<AtsCheck> checks = checker.check("Experience 2020 - 2024. Education 2016 - 2020.");
        assertThat(checks.stream().filter(c -> c.key().equals("phone")).findFirst().orElseThrow().passed()).isFalse();
    }

    @Test
    void scoreIsThePercentageOfPassedChecks() {
        List<AtsCheck> checks = List.of(
                new AtsCheck("a", "A", true, ""), new AtsCheck("b", "B", true, ""),
                new AtsCheck("c", "C", false, ""), new AtsCheck("d", "D", true, ""));
        assertThat(LocalAtsChecker.score(checks)).isEqualTo(75);
    }
}
