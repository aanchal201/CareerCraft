# Phase 4 – PDF Generation and Download

This guide explains what Phase 4 adds, why it's built this way, how to install it, and how to test it.

---

## 1. What we're building

| Feature | Where |
|---|---|
| **Download PDF** button | Resume editor toolbar |
| **Download PDF** icon on every resume card | `/resumes` |
| **Full-page preview** with page count and Download button | `/resumes/:id/preview` (⤢ button in the editor) |
| Correct A4 pages: no browser headers/footers, template colours printed, entries never split across pages, headings never left alone at the bottom of a page, spacing repeated on page 2 | Every template |
| Smart file name, e.g. `Asha_Verma_Frontend_Developer_Resume.pdf` | Print dialog |
| One-time "how to save as PDF" tips | First download |
| Ctrl/Cmd + P inside the editor prints **just the resume** | Editor |

No backend changes, no new libraries, no new environment variables.

---

## 2. Why the browser makes the PDF

There are three common ways to make a PDF in a web app:

| Approach | Looks like the preview? | Text selectable (ATS-friendly)? | Any language / symbol (₹, हिन्दी)? | Extra cost |
|---|---|---|---|---|
| **Browser print engine** ✅ chosen | **Identical**: same HTML and CSS | ✅ Yes | ✅ Yes | None |
| Server-side HTML→PDF (OpenHTMLtoPDF) | Close, but every template must be rebuilt in simpler CSS (no flexbox/grid) | ✅ Yes | Only with embedded fonts | New dependency + a second copy of every template |
| Screenshot → PDF (html2canvas + jsPDF) | Yes | ❌ No, it's an image | ✅ | Bad for ATS, blurry when zoomed |

ATS stands for applicant tracking system: the software companies use to read resumes. If the PDF's text can't be selected, an ATS sees an empty page. In Phase 5 our own analyzer will also extract text from PDFs.

The browser approach gives a pixel-perfect, text-based PDF with zero extra infrastructure. The trade-off is that the user clicks **Save as PDF** in the print dialog instead of getting a silent one-click download. The tips dialog covers that step.

---

## 3. How it works

```
Editor / Preview page
 ├─ <ResumePreview>     ← scaled-down copy you see on screen (Phase 3)
 └─ <PrintableResume>   ← full-size copy, rendered with a React portal
                          directly under <body> (outside #root),
                          hidden on screen

Click "Download PDF"
 └─ usePdfDownload()
     ├─ first time? → PdfTipsModal ("choose Save as PDF")
     └─ printResume(fileName)
          ├─ waits for web fonts to finish loading
          ├─ sets document.title = "Asha_Verma_…_Resume"   ← browsers use it as the file name
          ├─ window.print()
          └─ restores the title afterwards
```

### The print stylesheet (`styles/print.css`)

```css
@page { size: A4; margin: 0; }                                     /* A4, no browser margins */
body.has-printable-resume > *:not(.print-portal) { display: none }  /* hide app, modals, toasts */
body.has-printable-resume > .print-portal { display: block }        /* show only the resume */
```

- `PrintableResume` adds the `has-printable-resume` class to `<body>` while it's on the page. That's why Ctrl/Cmd + P in the editor prints just the resume, while printing any other page still works normally.
- **Zero page margins** leave Chrome no room for the date/URL header and footer, and the template's own padding gives the white border.

### Print rules inside the templates (`resumeTemplates.css`)

| Rule | Why |
|---|---|
| `print-color-adjust: exact` | Prints the Modern header band, tags and skill bars (browsers drop backgrounds by default) |
| `box-decoration-break: clone` | Repeats the top/bottom padding on **every** page, so page 2 doesn't start at the paper's edge |
| `break-inside: avoid` on each entry, the header and the summary | A job or degree is never split across two pages |
| `break-after: avoid` on section headings | A heading is never left alone at the bottom of a page |
| `min-height: 296mm` | One mm under A4, so rounding never creates an empty second page |

### A fix found while testing

When I extracted the text from a generated PDF, Classic's headings came out as `E D U C A T I O N`. Wide letter-spacing makes PDF text readers insert spaces, which an ATS would misread. Classic's heading spacing was reduced from `0.12em` to `0.07em`. All three templates now extract as clean words.

### Verified output

I generated real PDFs with Chrome's print engine for all three templates, one short and one long (2-page) version each, and checked that:
- pages are A4 (595 × 842 pt) and short resumes are exactly 1 page;
- the app and pop-ups never appear in the PDF;
- all text is extractable, with headings as whole words;
- page 2 has proper top spacing, entries are not split, and the Modern sidebar colour continues onto page 2.

---

## 4. Files in this phase

**New**
```
frontend/src/styles/print.css
frontend/src/utils/pdf.js                          buildPdfFileName, printResume, tips flag
frontend/src/hooks/usePdfDownload.jsx              tips-then-print flow
frontend/src/components/resume/PrintableResume.jsx
frontend/src/components/resume/PdfTipsModal.jsx/.css
frontend/src/pages/resumes/ResumePreviewPage.jsx/.css
```

**Updated**

| File | Change |
|---|---|
| `main.jsx` | imports `print.css` |
| `App.jsx` | new route `/resumes/:id/preview` (full screen, no sidebar) |
| `components/resume/editor/EditorToolbar.jsx` | + Download PDF, + full-page preview; Save is now secondary |
| `pages/resumes/ResumeEditorPage.jsx` | renders `PrintableResume`; download, and save-before-leaving for preview |
| `pages/resumes/ResumesPage.jsx/.css` | + Download PDF icon on each card |
| `components/resume/templates/resumeTemplates.css` | page-break rules, print block, Classic heading spacing |

Backend: unchanged.

---

## 5. Installing Phase 4

1. Stop the frontend dev server.
2. Unzip `careercraft.zip` somewhere temporary.
3. Replace `frontend/src` and `docs/` in your project with the ones from the zip. The backend is unchanged, but replacing `backend/src` too is harmless.
4. `cd frontend && npm run dev`.
5. Backend: `mvn test` should still show **29 tests, 0 failures**. Then start it as usual.

---

## 6. Phase 4 testing checklist

Test in **Chrome or Edge** first (best print support), then Firefox/Safari if you have them.

**Download from the editor**
- [ ] Open a resume → click **Download PDF** → the tips dialog appears (first time only)
- [ ] "Open print dialog" → the print preview shows **only the resume** (no sidebar, buttons or toasts)
- [ ] Destination **Save as PDF**, paper **A4** → the suggested file name is `Your_Name_Resume_Title_Resume` (or similar)
- [ ] Save → open the PDF: layout matches the on-screen preview; no date/URL in the corners
- [ ] Modern template: blue/teal header band and sidebar colours are present (if not, turn on **Background graphics**)
- [ ] Select text in the PDF and copy it → it pastes as normal words
- [ ] Download again → no tips dialog this time; the print dialog opens directly
- [ ] Type something and click Download immediately → the PDF includes the change you just typed
- [ ] Press **Ctrl/Cmd + P** in the editor → again only the resume

**Multi-page**
- [ ] Add 5–7 experience entries with several bullet lines until the preview shows "Page 2"
- [ ] PDF has 2 pages; page 2 starts with white space at the top, not at the edge
- [ ] No job entry is cut in half between pages; no heading sits alone at the bottom of page 1
- [ ] A 1-page resume never produces an empty 2nd page

**All templates**
- [ ] Repeat for Classic, Modern and Minimal, and with 2 different accent colours

**Full-page preview**
- [ ] ⤢ button in the editor → `/resumes/:id/preview` shows the resume large on a grey background (unsaved changes are saved first)
- [ ] "Edit" goes back to the editor; "Resumes" goes back to the list
- [ ] On a resume card, the download icon opens the preview **and** starts the download automatically

**Other**
- [ ] Printing the dashboard (Ctrl/Cmd + P there) still prints the dashboard, not a resume
- [ ] To see the tips dialog again: DevTools → Application → Local Storage → delete `careercraft_pdf_tips_seen`

---

## 7. Browser notes and troubleshooting

| Symptom | Fix |
|---|---|
| Date, URL or page numbers printed in the corners | Turn off **Headers and footers** in the print dialog (Firefox shows them by default). |
| Modern template prints without colours | Turn on **Background graphics** ("More settings" in Chrome; "Print backgrounds" in Firefox). |
| Content is shrunk or cut off | Set **Scale** to 100% / Default and paper size to **A4**. If your default is Letter, pick A4. |
| Safari: no "Save as PDF" option | In Safari's print dialog use the **PDF** dropdown at the bottom left → **Save as PDF**. |
| Phone: no print dialog | Most mobile browsers use **Share → Print** (iOS) or **Print** in the menu (Android). For best results, download on a computer. |
| PDF fonts look different from the app | Wait a second after the page loads (fonts download from Google Fonts), then download again. |
| File name is "CareerCraft…" instead of your name | Fill in **Full name** in Personal information. |
| An extra blank page at the end | Report the template and browser to me. The `296mm` rule normally prevents this, but browsers differ slightly. |

If something else looks wrong, send me a screenshot of the PDF and tell me which browser you used.
