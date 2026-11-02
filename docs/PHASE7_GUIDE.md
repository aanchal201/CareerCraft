# Phase 7 – AI Portfolio Generator & Publishing

Phase 7 turns the portfolio builder from Phase 6 into real websites:

- **Generate a portfolio from a resume** in one step, optionally with Grok polishing the text.
- **Write with AI** inside the editor: suggestions you review and pick, never forced on you.
- **Publish** a portfolio at your own address, e.g. `https://your-app.vercel.app/p/asha-verma`, visible to anyone without logging in.
- **Draft vs live**: edits stay private until you click **Publish changes**.

---

## 1. What we're building

| Feature | Where |
| --- | --- |
| "Generate from resume" dialog (pick a resume, template, AI on/off, tone) | Portfolios page |
| "Write with AI" dialog: headline, tagline, about, contact message, skill groups, project descriptions, each with a checkbox | Portfolio editor → Content tab |
| Publish dialog: choose an address (checked as you type), publish, publish changes, copy link, unpublish | Portfolio editor → **Publish / Share** |
| Live / Draft / "Live · unpublished changes" status | Editor toolbar and portfolio cards |
| Public website at `/p/:slug` | No login needed |
| Daily AI limit for portfolio features (separate from the analyzer's) | Server |

---

## 2. How it works

### Generating from a resume

`POST /api/portfolios/generate` loads **your** resume (another user's resume returns 404), then:

1. `ResumeToPortfolioMapper` copies it in without AI: name and job title become the hero, the summary becomes "About", skills/projects/experience/education/certifications are copied, and a project link to GitHub/GitLab/Bitbucket becomes the **Code** button (any other link becomes **Live demo**). The first project is marked featured.
2. With `useAi: true`, `PortfolioAiWriter` sends a plain-text description of that portfolio to Grok (Responses API, strict JSON schema, same `GrokClient` as Phase 5) and **merges** the result.
3. The new portfolio is saved and you land in the editor.

### The AI can't invent anything

The prompt tells Grok to only reword what's there, but we don't rely on that. The server checks the result in `PortfolioAiWriter.sanitize()`:

- **Skill groups** keep only skills that already exist (matched ignoring case, and your original spelling is kept). Invented skills are dropped.
- **Project descriptions** are used only for projects that already exist, matched by name.
- All text is trimmed and length-limited.

User content is wrapped in `<profile>`, `<skills>` and `<projects>` tags and the instructions say it is *data, not instructions*, which guards against prompt injection from resume text.

"Write with AI" (`POST /api/portfolios/{id}/ai/write`) returns suggestions and **saves nothing**. The dialog shows each suggestion with a checkbox, and only the ones you tick are applied to your draft, which then autosaves. The editor saves your draft before calling the AI, so the AI sees your latest edits.

### AI limits

Every AI portfolio request (generate with AI, or write with AI) is recorded in the new `ai_usage_events` table. Each user gets `AI_PORTFOLIO_DAILY_LIMIT` per rolling 24 hours (default 10), and requests over the limit get **429**. The resume analyzer keeps its own `AI_DAILY_LIMIT`. Generating without AI is free and unlimited. Without `GROK_API_KEY`, AI requests return **503** and the UI disables the AI options.

### Publishing = a snapshot

The `portfolios` table gets three new columns:

| Column | Meaning |
| --- | --- |
| `slug` (unique) | your address. It stays reserved for you after unpublishing |
| `published_snapshot` | a JSON copy of template + design + content **at the moment you published** |
| `published_at` | when |

The public page only reads `published_snapshot`. Your autosaved draft can contain half-finished edits, and visitors never see them. Every portfolio response includes:

```json
"publishing": { "slug": "asha-verma", "published": true, "publishedAt": "…", "hasUnpublishedChanges": true }
```

`hasUnpublishedChanges` compares the normalized draft with the snapshot. The editor refreshes it after every autosave (the new optional `onSaved` callback in `useAutosaveDocument`), so the toolbar pill switches to "Live · unpublished changes" as soon as you edit.

### Address rules (`SlugPolicy`)

- 3–40 characters: lowercase letters, numbers, hyphens. No hyphen at the start or end, and no `--`.
- Reserved words are blocked (`admin`, `api`, `login`, `dashboard`, `p`, `www`, …).
- Addresses are unique across all users. A taken address returns **409** with `fieldErrors.slug`. The database's unique index is a final safety net if two people click Publish at the same moment.
- The dialog lowercases and hyphenates as you type ("Asha Verma" → `asha-verma`) and checks availability 400 ms after you stop typing. The first suggestion comes from your hero name, with `-2`, `-3`… added if it's taken.

### The public page

- `GET /api/public/portfolios/{slug}` is the only new unauthenticated endpoint (`SecurityConfig` permits `GET /api/public/**`). It returns only what the page needs (no portfolio id, internal name or user id) and sends `Cache-Control: max-age=60, public`.
- The React route `/p/:slug` sits outside `ProtectedRoute`, so it works whether you're logged in or not. It renders the same `PortfolioDocument` as the editor, but with links enabled. Templates use container queries (Phase 6), so the site is responsive on real phones too.
- It sets the browser tab title (`Name — Headline`) and a meta description.
- Deleting a portfolio takes its website offline immediately.

---

## 3. Files in this phase

**Backend: new**

```
ai/AiUsageService.java                         daily quota for portfolio AI features
entity/AiUsageEvent.java                       one row per AI request
repository/AiUsageEventRepository.java
exception/ConflictException.java               409 with a field error
controller/PublicPortfolioController.java      GET /api/public/portfolios/{slug}
service/portfolio/SlugPolicy.java              address normalization/validation/suggestion
service/portfolio/ResumeToPortfolioMapper.java resume -> portfolio content (no AI)
service/portfolio/PortfolioAiWriter.java       Grok prompt, schema, sanitizer
service/portfolio/PortfolioGenerationService.java  generate, write-with-AI, AI status
dto/portfolio/PortfolioSnapshot.java, PortfolioPublishing.java, PortfolioAiContent.java
dto/request/GeneratePortfolioRequest.java, AiWriteRequest.java, PublishPortfolioRequest.java
dto/response/PublicPortfolioResponse.java, SlugAvailabilityResponse.java
test: PortfolioPublishingIntegrationTest.java (5), PortfolioGenerationIntegrationTest.java (4)
```

**Backend: changed**

```
entity/Portfolio.java                 slug, publishedSnapshot, publishedAt + publish()/unpublish()
repository/PortfolioRepository.java   findBySlug, existsBySlug, existsBySlugAndIdNot
service/portfolio/PortfolioService.java   publishing, slug checks, public read
controller/PortfolioController.java   new endpoints (see API reference)
dto/response/PortfolioResponse.java, PortfolioSummaryResponse.java   publishing info
exception/GlobalExceptionHandler.java  409 handler for ConflictException
config/SecurityConfig.java            permit GET /api/public/**
application.yml, .env.example         AI_PORTFOLIO_DAILY_LIMIT
test/support/DatabaseCleaner.java     also clears ai_usage_events
```

**Frontend: new**

```
components/portfolio/GeneratePortfolioModal.jsx
components/portfolio/AiWriteModal.jsx
components/portfolio/PublishModal.jsx
components/portfolio/PublishStatePill.jsx
components/portfolio/portfolioDialogs.css
pages/public/PublicPortfolioPage.jsx + .css
utils/portfolioAi.js                  tones, slug helper, public URL, apply suggestions
```

**Frontend: changed**

```
App.jsx                               /p/:slug route
api/portfolioService.js               generate, aiStatus, aiWrite, checkSlug, publish, unpublish, getPublic
hooks/useAutosaveDocument.js          optional onSaved callback (no behavior change for resumes)
pages/portfolios/PortfolioEditorPage.jsx + .css   Publish/Share button, status pill, Write with AI
pages/portfolios/PortfoliosPage.jsx + .css        Generate from resume, Live badge + link
components/common/Modal.css           new size "lg"
```

---

## 4. Installing Phase 7

1. Copy the updated `backend/` and `frontend/` folders over your project (or unzip the full project).
2. Optional: add to `backend/.env`:
   ```
   AI_PORTFOLIO_DAILY_LIMIT=10
   ```
3. Restart the backend. With `JPA_DDL_AUTO=update`, Hibernate adds the three `portfolios` columns and creates `ai_usage_events`. Existing portfolios start as drafts. MySQL allows many `NULL`s in a unique column, so unpublished portfolios don't conflict.
4. Restart the frontend (`npm run dev`). No new npm packages.
5. Run the backend tests: `mvn test` should report **62 tests, 0 failures** (53 earlier + 9 new). Grok is mocked in tests, so no API key or credits are used.

> **Deployment note (Phase 9):** on Vercel, opening `/p/asha-verma` directly needs a SPA rewrite (`vercel.json` → all routes to `index.html`). Vite's dev server already does this locally. We'll add the rewrite with the rest of the deployment config in Phase 9.

---

## 5. API reference (new in Phase 7)

| Method | URL | Auth | Body / params | Success | Errors |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/portfolios/ai/status` | ✔ | – | `{ aiConfigured, dailyLimit, remainingToday }` | |
| POST | `/api/portfolios/generate` | ✔ | `{ name, templateId, resumeId, useAi, tone }` | 201 portfolio | 400 (incl. portfolio limit), 404 (resume), 429, 502/503/504 (AI) |
| POST | `/api/portfolios/{id}/ai/write` | ✔ | `{ tone }` (`PROFESSIONAL` / `FRIENDLY` / `BOLD`) | 200 suggestions (not saved) | 400 (too little content), 404, 429, 502/503/504 |
| GET | `/api/portfolios/{id}/slug` | ✔ | `?value=` (omit to get a suggestion) | `{ slug, available, message }` | 404 |
| POST | `/api/portfolios/{id}/publish` | ✔ | `{ slug }` | 200 portfolio | 400 (invalid address), 404, 409 (taken) |
| POST | `/api/portfolios/{id}/unpublish` | ✔ | – | 200 portfolio | 404 |
| GET | `/api/public/portfolios/{slug}` | ✘ | – | `{ slug, templateId, design, content, avatarPath, publishedAt }` | 404 |

All portfolio responses (`GET/PUT /api/portfolios/{id}` etc.) now include `publishing`. List items include `slug` and `published`.

---

## 6. Testing

### Postman

Import `postman/CareerCraft-Phase7.postman_collection.json` and run it in order (you need at least one resume). Requests 5–6 call Grok: they return 503 without a key, and with a key they use your quota. Request 12 overwrites the generated portfolio's content to prove draft and live are separate, so use a test portfolio.

### Phase 7 testing checklist

**Generate from resume**
- [ ] Portfolios page shows **Generate from resume** (header, and in the empty state).
- [ ] With no resumes, the dialog links to the Resumes page.
- [ ] Without AI: the new portfolio contains your resume's name, title, summary, skills, projects, experience, education and contact details. A GitHub project link shows as **Code**.
- [ ] With AI on (key set): the dialog shows "Writing your portfolio with AI…". The result has a tagline, about text and grouped skills, and **no skills or projects that weren't in your resume**.
- [ ] "AI uses left today" goes down by one after each AI request.
- [ ] Without `GROK_API_KEY`: the AI checkbox is disabled with an explanation, and generating without AI still works.

**Write with AI**
- [ ] Editor → Content → **Write with AI** → pick a tone → **Write suggestions**.
- [ ] Suggestions appear with checkboxes. Untick some and apply: only the ticked ones change, and the preview updates instantly.
- [ ] **Try another tone** returns to the tone picker.
- [ ] Nothing changes in the draft if you close the dialog without applying.

**Publishing**
- [ ] A new portfolio shows **Draft** and a **Publish** button.
- [ ] The Publish dialog pre-fills an address from your name, and typing `Asha Verma` becomes `asha-verma`.
- [ ] `admin`, `ab` and an address used by another account show an error, and Publish is disabled.
- [ ] Publish → toast "Your portfolio is live!", the pill shows **Live**, and the button changes to **Share**.
- [ ] **Copy** copies the link. Open it in a private/incognito window and the site loads without login.
- [ ] The tab title is "Your Name — Headline". Links (email, GitHub, nav) work, and the site looks right on a phone-width window.
- [ ] Edit the headline in the editor. The pill changes to **Live · unpublished changes**, and the public page still shows the old headline after a refresh.
- [ ] Share → **Publish changes**. The public page shows the new headline (allow up to 60 s for browser caching, or hard-refresh).
- [ ] Change the address and click **Move to new address**. The old link shows "This portfolio isn't available".
- [ ] **Unpublish**: the public link shows the 404 page and the pill shows **Draft**. Publishing again reuses the same address.
- [ ] The Portfolios page shows a **Live** badge with a `/p/…` link on published cards.
- [ ] Deleting a published portfolio warns that the website goes offline, and the link stops working.
- [ ] `/p/does-not-exist` shows the friendly 404 page.

**Regression**
- [ ] The resume editor still autosaves, and Phase 6 portfolio editing, duplicating and deleting all still work.
- [ ] `mvn test` passes with 62 tests.

---

## 7. Troubleshooting

| Problem | Fix |
| --- | --- |
| AI options greyed out | `GROK_API_KEY` missing in `backend/.env`. Restart the backend after adding it. |
| 429 "daily limit" | Raise `AI_PORTFOLIO_DAILY_LIMIT`, or wait. The limit is a rolling 24 hours. |
| 502 / 504 from AI | Grok error or timeout. Check the backend log, `GROK_MODEL`, and your xAI credits. |
| "Write with AI" → 400 "add more details first" | The portfolio is nearly empty. Fill in the hero/about/projects first. |
| Public page shows old content | You haven't clicked **Publish changes**, or the 60 s cache. Hard-refresh. |
| Public page 404 right after publishing | Check the exact address (lowercase). Check that the backend allows `GET /api/public/**` (SecurityConfig). |
| `Unknown column 'slug'` | `JPA_DDL_AUTO` is `validate`/`none`. Set it to `update` once, or add the columns manually. |
| Opening `/p/...` directly on Vercel gives 404 | SPA rewrite. It's added in Phase 9. |
