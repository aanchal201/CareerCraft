# Phase 3 – Resume Builder

This guide explains what Phase 3 adds, how it works, how to install it on top of Phase 2, and how to test it.

---

## 1. What we're building

| Feature | Where |
|---|---|
| Resume list: create, open, duplicate, delete (up to 20 per user) | `/resumes` |
| "New resume" dialog with real template thumbnails and "fill from my profile" | `/resumes` |
| Two-pane editor: form on the left, live A4 preview on the right | `/resumes/:id` |
| 9 sections: Personal info, Summary, Experience, Education, Skills, Projects, Certifications, Achievements, Languages | Editor |
| Add / remove / reorder entries in each section | Editor |
| Show / hide, rename and reorder whole sections | Editor (eye and arrow buttons) |
| 3 templates (Classic, Modern, Minimal) + 8 accent colors, switchable any time | Editor toolbar |
| Autosave (~1.2 s after you stop typing) with a Saved / Saving / Error indicator | Editor toolbar |
| Page-break markers and page count in the preview | Preview |
| "Your resumes" card on the dashboard; "Resumes" enabled in the sidebar | Dashboard, sidebar |

No new libraries and no new environment variables.

> **About "AI" in this phase.** The roadmap first connects the AI API (Grok) in Phase 5, so Phase 3 makes **no AI calls**. The editor is structured so AI actions like "write my summary" or "improve these bullet points" can be added to the Summary and Description fields later without rework.

---

## 2. How it works

### Storage: one JSON document per resume

```
users 1 ──── * resumes
                id, user_id, title, template_id, accent_color,
                content (JSON text, MEDIUMTEXT), created_at, updated_at
```

**Why not one table per section, like the profile?**
- A resume is always **loaded and saved as a whole**: the editor sends the complete document on every save.
- It's a **snapshot** you tailor per job. Copying from the profile means editing a resume never changes your profile, or your other resumes.
- **Section order, visibility and headings** are part of the document.
- We never search *inside* a resume.

Nine tables multiplied by many resumes would mean dozens of queries per save for no benefit. The data is still **typed and validated**: the JSON goes through Java records (`dto/resume/*`) with `@Size` / `@Pattern` rules before it's saved.

**The content document** (`ResumeContent`):

```json
{
  "personal": { "fullName": "...", "jobTitle": "...", "email": "...", "phone": "...", "location": "...",
                "website": "https://...", "linkedin": "https://...", "github": "https://..." },
  "summary": "...",
  "experience":     [ { "id": "uuid", "jobTitle": "", "company": "", "location": "", "startDate": "2024-06",
                        "endDate": "", "current": true, "description": "line 1\nline 2" } ],
  "education":      [ { "id", "institution", "degree", "fieldOfStudy", "location", "startDate", "endDate",
                        "current", "grade", "description" } ],
  "skills":         [ { "id", "name", "level": "ADVANCED" } ],
  "projects":       [ { "id", "name", "role", "technologies", "link", "startDate", "endDate", "description" } ],
  "certifications": [ { "id", "name", "issuer", "date", "link" } ],
  "achievements":   [ { "id", "title", "date", "description" } ],
  "languages":      [ { "id", "name", "proficiency": "Fluent" } ],
  "sections": [ { "key": "summary", "title": "Professional Summary", "visible": true }, … 8 in total ]
}
```

Dates are `"YYYY-MM"` (or empty). Each line of a description becomes a bullet point on the resume.

### The normalizer

`ResumeContentNormalizer` runs on **every save and every load**:
- null lists become `[]`, and a missing `personal` becomes an empty one;
- every item gets an `id` (React uses it as the list key);
- `sections` always contains all **8 keys exactly once**: unknown keys and duplicates are dropped, missing ones are appended, and blank headings get the default.

The frontend (and later the AI and PDF features) can therefore rely on a predictable shape.

### Prefill from profile

When "Fill it in from my profile" is ticked, `ResumeContentFactory.fromProfile()` copies your name, headline (as job title), contact links, About (as summary), education, experience, skills and certifications into the new resume.

### Ownership

Every query is `findByIdAndUserId(id, userIdFromJwt)`, the same pattern as Phase 2. Someone else's resume id returns **404**, and a test proves it.

### Frontend architecture

```
ResumesPage ──► CreateResumeModal ──► TemplatePicker (real thumbnails)
                    │ POST /api/resumes
                    ▼
ResumeEditorPage  (loads GET /api/resumes/:id)
 └─ ResumeEditor
     ├─ useResumeEditor()   ← state + debounced autosave (PUT /api/resumes/:id)
     ├─ EditorToolbar       ← title, template, accent color, save status
     ├─ SectionCard × 9     ← collapse, show/hide, move up/down, rename
     │   ├─ PersonalEditor
     │   └─ ListEditor      ← generic: reads field definitions from sectionConfig.js
     └─ ResumePreview       ← renders ResumeDocument at true A4 size, scaled to fit
          └─ ResumeDocument → ClassicTemplate | ModernTemplate | MinimalTemplate
                               (all share SectionBlocks.jsx; differences are layout + CSS)
```

Key ideas:

- **One source of truth.** The preview renders the same `doc` state the form edits, so it updates on every keystroke without a network round-trip.
- **Config-driven forms.** `sectionConfig.js` lists each section's fields (label, type, placeholder…). `ListEditor` and `FieldRenderer` turn that into forms, so adding a field to Projects is a one-line change.
- **Templates at true size.** The resume is always rendered as a real **794 × 1123 px A4 page** and shrunk with `transform: scale()`. The preview is pixel-for-pixel what a printed page will look like. Dashed lines mark where page 2 starts.
- **Autosave design** (`hooks/useResumeEditor.js`):
  1. every edit updates state, so the preview re-renders instantly;
  2. after 1.2 s without changes, `save()` sends the whole document;
  3. only **one save runs at a time**: if you type during a save, another save is queued when it finishes;
  4. a browser warning appears if you try to close the tab with unsaved changes;
  5. "← Resumes" saves before leaving.
- **Isolated template CSS.** `resumeTemplates.css` uses `.resume`, `rs-*` and `rt-*` classes with px sizes and print-safe fonts, so the app's design system can't change how a resume looks.

---

## 3. Files in this phase

**Backend – new**
```
entity/Resume.java
repository/ResumeRepository.java
dto/resume/   ResumeContent, ResumePersonal, ResumeExperience, ResumeEducation, ResumeSkill,
              ResumeProject, ResumeCertification, ResumeAchievement, ResumeLanguage,
              ResumeSection, ResumeFormats
dto/request/  CreateResumeRequest, UpdateResumeRequest
dto/response/ ResumeResponse, ResumeSummaryResponse
service/resume/ ResumeService, ResumeContentNormalizer, ResumeContentFactory, ResumeTemplates
controller/ResumeController.java
test: ResumeControllerIntegrationTest.java, support/DatabaseCleaner.java
```

**Backend – updated:** `AuthControllerIntegrationTest` and `ProfileControllerIntegrationTest` now use the shared `DatabaseCleaner`, which also empties the new `resumes` table. No production file from earlier phases changed.

**Frontend – new**
```
api/resumeService.js
hooks/useResumeEditor.js
utils/resume.js
pages/resumes/ ResumesPage.jsx/.css, ResumeEditorPage.jsx/.css
components/resume/
  CreateResumeModal.jsx, TemplatePicker.jsx/.css, ResumeThumbnail.jsx,
  ResumePreview.jsx/.css, RecentResumesCard.jsx/.css
  editor/    EditorToolbar.jsx, SectionCard.jsx, PersonalEditor.jsx, ListEditor.jsx,
             FieldRenderer.jsx, sectionConfig.js
  templates/ templateRegistry.js, ResumeDocument.jsx, SectionBlocks.jsx,
             ClassicTemplate.jsx, ModernTemplate.jsx, MinimalTemplate.jsx, resumeTemplates.css
```

**Frontend – updated:** `App.jsx` (two new routes), `layouts/DashboardLayout.jsx/.css` (full-width mode for the editor), `components/layout/Sidebar.jsx` ("Resumes" is now a real link), `pages/dashboard/DashboardPage.jsx/.css` ("Your resumes" card), `utils/date.js` (+ `formatRelativeTime`, `formatMonth` accepts `YYYY-MM`).

---

## 4. Installing Phase 3 on top of Phase 2

1. Stop the backend and frontend.
2. Unzip `careercraft.zip` somewhere temporary.
3. Replace `backend/src`, `frontend/src`, `postman/` and `docs/` in your project with the ones from the zip. Keep your `.env` files.
4. Run the tests:
   ```bash
   cd backend
   mvn test
   ```
   Expected: **`Tests run: 29, Failures: 0, Errors: 0`** (10 auth + 12 profile + 7 resume).
5. Start the backend (`mvn spring-boot:run`). Hibernate creates the `resumes` table.
6. Start the frontend (`npm run dev`) and open **Resumes** in the sidebar.

---

## 5. API reference (new in Phase 3)

All endpoints need `Authorization: Bearer <token>`.

| Method | Endpoint | Success | Body / notes |
|---|---|---|---|
| GET | `/api/resumes` | 200 | List (newest first), **without** content |
| POST | `/api/resumes` | 201 | `{ "title", "templateId": "classic\|modern\|minimal", "prefillFromProfile": true }` |
| GET | `/api/resumes/{id}` | 200 | Full resume with `content` |
| PUT | `/api/resumes/{id}` | 200 | `{ "title", "templateId", "accentColor": "#rrggbb", "content": {…} }` (whole document) |
| POST | `/api/resumes/{id}/duplicate` | 201 | Copy titled "… (copy)" |
| DELETE | `/api/resumes/{id}` | 204 | |

**Errors:**
- **400** for an unknown template, a bad colour, a date that isn't `YYYY-MM`, a URL without `http(s)://`, or text that's too long. Nested field errors look like `"content.experience[0].startDate": "Use the format YYYY-MM"`.
- **400** when you already have 20 resumes.
- **404** when the resume isn't yours or doesn't exist.

---

## 6. Testing with Postman

Import `postman/CareerCraft-Phase3.postman_collection.json` and run requests 1 → 11 in order. Request 1 logs in. Edit its body if your account isn't `asha@example.com` / `secret123`.

| # | Expected |
|---|---|
| 2 | 201, `content.sections` has 8 entries, prefilled from your profile |
| 3 | 400 with `fieldErrors.templateId` |
| 4 / 5 | 200 |
| 6 | 200; only 3 sections were sent but 8 come back, with "About Me" first |
| 7 | 400 (bad colour and bad date) |
| 8 | 201, title ends with "(copy)" |
| 9 / 10 | 204 then 404 |
| 11 | 401 |

---

## 7. Phase 3 testing checklist

**Backend**
- [ ] `mvn test` → 29 tests pass
- [ ] `resumes` table exists; `SELECT title, LEFT(content, 120) FROM resumes;` shows JSON
- [ ] All 11 Postman requests pass

**Resume list**
- [ ] Sidebar "Resumes" opens `/resumes`; with no resumes you see the empty state
- [ ] "Create a resume" → dialog shows 3 template thumbnails; the selected one is highlighted
- [ ] Creating without a name shows "Give your resume a name"
- [ ] With "Fill it in from my profile" ticked, the new resume already has your education, experience and skills
- [ ] With it unticked, only your name and email are filled
- [ ] Cards show template name and "Edited … ago"; Duplicate adds "(copy)"; Delete asks for confirmation

**Editor**
- [ ] Typing in any field updates the preview instantly
- [ ] Status goes "Unsaved changes" → "Saving…" → "Saved" about a second after you stop typing
- [ ] Refresh the page → your changes are still there
- [ ] Rename the resume in the toolbar → back on the list, the new name shows
- [ ] Switching Classic / Modern / Minimal changes the layout immediately; your content is unchanged
- [ ] Each accent colour updates headings, bullets and (Modern) the header band
- [ ] Add 2 experiences → reorder them with ↑ ↓ → order changes in the preview
- [ ] "I currently work here" disables End date and shows "Present"
- [ ] Each line of a description shows as a bullet point
- [ ] Eye icon hides a section from the preview (the card says "Hidden from resume"); clicking again shows it
- [ ] Move a whole section up/down → it moves in the preview
- [ ] Rename a section heading (e.g. "Professional Summary" → "About Me") → preview updates
- [ ] Empty sections don't appear in the preview
- [ ] Modern template: skills, languages and certifications appear in the sidebar column
- [ ] Add lots of content → a dashed "Page 2" line appears and the page count updates
- [ ] Type `github.com/me` (no https) in a link field → inline error; status shows "Not saved" with the reason; fixing it saves again
- [ ] Try closing the tab right after typing → the browser asks for confirmation
- [ ] "← Resumes" returns to the list with everything saved

**Responsive**
- [ ] Below ~1180px the editor shows Edit / Preview tabs instead of side-by-side
- [ ] On a phone the toolbar wraps neatly and nothing scrolls sideways

**Security**
- [ ] Open another account's resume URL (`/resumes/<their id>`) → "Resume not found"

---

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| Status stuck on "Not saved" | Hover the status or read the red message under the toolbar. It names the field (usually a link missing `https://`). |
| `Data truncation` / `Data too long for column 'content'` | An old `resumes` table from an experiment has a smaller column. `DROP TABLE resumes;` and restart. |
| Preview is blank or tiny | Hard-refresh (Ctrl/Cmd+Shift+R). The preview measures its container on load. |
| Month fields show as text boxes | Older Safari; type `2024-06`. |
| "You can have up to 20 resumes" | Delete or reuse an old one. The limit is in `ResumeService.MAX_RESUMES_PER_USER`. |
| Fonts in the preview look different from the app | Expected: Classic uses Georgia (a print-safe serif) on purpose. |

If you hit an error not listed here, send me the backend log or browser console output and the step you were on.
