package com.careercraft.service.analysis;

import com.careercraft.exception.InvalidRequestException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Extracts plain text from an uploaded resume PDF using Apache PDFBox.
 *
 * Only text-based PDFs work (the kind Word, Google Docs or CareerCraft's
 * "Save as PDF" produce). A scanned image has no text layer - we detect that
 * and tell the user, instead of sending an empty resume to the AI.
 */
@Component
public class ResumeTextExtractor {

    public static final long MAX_PDF_BYTES = 5L * 1024 * 1024;
    static final int MAX_PAGES = 10;
    static final int MIN_TEXT_CHARS = 150;
    /** Plenty for any resume; keeps the AI request small and cheap. */
    static final int MAX_TEXT_CHARS = 30_000;

    public String extract(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("file", "Please choose a PDF to upload");
        }
        if (file.getSize() > MAX_PDF_BYTES) {
            throw new InvalidRequestException("file", "The PDF must be 5 MB or smaller");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException ex) {
            throw new InvalidRequestException("file", "Could not read the uploaded file");
        }
        return extract(bytes);
    }

    String extract(byte[] bytes) {
        // Every PDF starts with "%PDF" - don't trust the file name or Content-Type
        if (bytes.length < 5 || bytes[0] != '%' || bytes[1] != 'P' || bytes[2] != 'D' || bytes[3] != 'F') {
            throw new InvalidRequestException("file", "Only PDF files are supported");
        }

        try (PDDocument document = Loader.loadPDF(bytes)) {
            if (document.getNumberOfPages() > MAX_PAGES) {
                throw new InvalidRequestException("file", "This PDF has more than " + MAX_PAGES
                        + " pages. Please upload just your resume.");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true); // read columns/lines in visual order
            String text = normalize(stripper.getText(document));

            if (text.length() < MIN_TEXT_CHARS) {
                throw new InvalidRequestException("file", "We couldn't find readable text in this PDF. "
                        + "It may be a scanned image - export your resume as a text-based PDF and try again.");
            }
            return text.length() > MAX_TEXT_CHARS ? text.substring(0, MAX_TEXT_CHARS) : text;
        } catch (InvalidPasswordException ex) {
            throw new InvalidRequestException("file", "This PDF is password-protected. Remove the password and try again.");
        } catch (IOException ex) {
            throw new InvalidRequestException("file", "This PDF could not be read. It may be damaged.");
        }
    }

    /** Tidies extracted text: unify line breaks/spaces, trim lines, collapse blank lines. */
    static String normalize(String raw) {
        if (raw == null) return "";
        return raw
                .replace("\r\n", "\n")
                .replace('\r', '\n')
                .replace(' ', ' ')
                .replaceAll("[\\t\\x0B\\f ]+", " ")
                .replaceAll(" *\n *", "\n")
                .replaceAll("\n{3,}", "\n\n")
                .trim();
    }
}
