package com.careercraft.support;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

/** Builds small, real PDFs for tests (text-based, one line per argument). */
public final class TestPdfs {

    private TestPdfs() {
    }

    public static byte[] withLines(String... lines) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                stream.beginText();
                stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                stream.setLeading(15);
                stream.newLineAtOffset(50, 740);
                for (String line : lines) {
                    stream.showText(line);
                    stream.newLine();
                }
                stream.endText();
            }
            document.save(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException(ex);
        }
    }

    /** A plausible resume (ASCII only, since the built-in Helvetica font has no "•"). */
    public static byte[] sampleResume() {
        return withLines(
                "Asha Verma",
                "Frontend Developer",
                "asha@example.com | +91 98765 43210 | linkedin.com/in/asha",
                "EXPERIENCE",
                "Software Engineering Intern - Acme Technologies | Jun 2024 - Aug 2024",
                "- Built 12 React components used by 5000 users",
                "- Reduced page load time by 30% with code splitting",
                "- Mentored 3 interns and wrote REST APIs in Spring Boot",
                "EDUCATION",
                "B.Tech, Computer Science - University of Mumbai | 2021 - 2025",
                "SKILLS",
                "React, JavaScript, Java, Spring Boot, MySQL, Git"
        );
    }
}
