# Phase 6 – Personal Portfolio Builder

This guide explains what Phase 6 adds, how it works, how to install it, and how to test it.

---

## 1. What we're building

| Feature | Where |
|---|---|
| Portfolio list: create, open, duplicate, delete (up to 10 designs) | `/portfolios` |
| "New portfolio" dialog with live template thumbnails and "fill from my profile" | `/portfolios` |
| Editor with **Content** and **Design** tabs and a live preview | `/portfolios/:id` |
| Sections: **Hero**, About, Skills, Projects, Experience, Education, Certifications, Contact | Content tab |
| Show / hide, rename and reorder sections (Hero is always first) | Content tab |
| 3 templates: **Minimal**, **Bold**, **Sidebar** | Design tab |
| Accent color (8 presets + any custom color), **light / dark** mode | Design tab |
| 4 font pairings: Modern, Editorial, Tech, Friendly | Design tab |
| Hero alignment (left / center), projects as grid or list | Design tab |
| **Desktop / tablet / mobile** preview switch | Preview |
| Autosave (shared with the resume editor) | Toolbar |

No new libraries and no new environment variables. Publishing and public URLs come in **Phase 7**.

---

## 2. How it works

### Storage

```
users 1 ──── * portfolios
                id, user_id, name, template_id,
                design  (JSON: primaryColor, colorMode, fontPairing, heroAlign, projectLayout),
                content (JSON: hero, about, skills, projects, experience, education,
                               certifications, contact, sections[]),
                created_at, updated_at
```

This is the same approach as resumes (Phase 3), for the same reasons: a portfolio is loaded and saved as a whole, it's an independent snapshot of your profile, and it's validated through Java records (`dto/portfolio/*`).

`PortfolioNormalizer` runs on every save and load:
- every list item gets an id;
- all **7 section keys** exist exactly once, in your order;
- design values outside the allowed set fall back to defaults. For example, an empty `heroAlign` becomes `LEFT`.

### Responsive templates with container queries

A portfolio must look right on phones, but the editor preview lives inside a narrow panel on a desktop screen. Normal `@media` queries react to the *browser window*, so the preview would always show the desktop layout.

The templates use **CSS container queries** instead:

```css
.pf { container: pf / inline-size; }          /* the portfolio root is a container */

@container pf (max-width: 720px) {            /* "when the portfolio box is narrow" */
  .pf-projects--grid { grid-template-columns: 1fr; }
}
```

Now the layout reacts to the **width of its box**:
- the preview renders the page at exactly **1280 / 820 / 390 px** and scales it down, so the desktop, tablet and mobile previews are accurate;
- the public page in Phase 7 will use the *same* components at full width, with no second set of styles.

Headline sizes use container units (`clamp(40px, 7cqi, 72px)`), so they scale with the box too.

### Theming

`PortfolioDocument` turns the design into CSS variables on the root element:

| Variable | From |
|---|---|
| `--pf-accent` | your accent color |
| `--pf-on-accent` | white or near-black, picked by `contrastText()` from the color's brightness (WCAG luminance), so buttons stay readable with any color |
| `--pf-bg`, `--pf-surface`, `--pf-text`, `--pf-muted`, `--pf-border` | light or dark palette |
| `--pf-font-heading`, `--pf-font-body` | the font pairing |

Fonts for a pairing are loaded from Google Fonts **only when first used** (`utils/fonts.js`), so the rest of the app doesn't download them.

### Shared editor code (refactor)

- **`hooks/useAutosaveDocument.js`** (new) holds the autosave logic: debounce, one save at a time, retry after edits made during a save, and the unsaved-changes warning. `useResumeEditor` is now a thin wrapper around it, and the portfolio editor uses it directly. Resume behaviour is unchanged.
- **`ListEditor`** now accepts optional `config` and `createItem` props. Without them it behaves exactly as before (resume sections). The portfolio editor passes its own definitions from `portfolioSectionConfig.js`.
- `SectionCard`, `FieldRenderer` and the editor styles (`ResumeEditorPage.css`) are reused as-is.

### Editor preview safety

In the preview, `PortfolioDocument` gets `interactive={false}`: clicks on links are cancelled, so "Get in touch" or a project link doesn't navigate away from the editor.

---

## 3. Files in this phase

**Backend – new**
```
entity/Portfolio.java
repository/PortfolioRepository.java
dto/portfolio/   PortfolioContent (+ nested Hero, About, Skill, Project, Experience,
                 Education, Certification, Contact, Section), PortfolioDesign
dto/request/     CreatePortfolioRequest, UpdatePortfolioRequest
dto/response/    PortfolioResponse, PortfolioSummaryResponse
service/portfolio/ PortfolioService, PortfolioNormalizer, PortfolioContentFactory, PortfolioTemplates
controller/PortfolioController.java
test: PortfolioControllerIntegrationTest.java  (DatabaseCleaner updated)
```

**Frontend – new**
```
api/portfolioService.js
hooks/useAutosaveDocument.js
utils/color.js, utils/fonts.js
pages/portfolios/  PortfoliosPage.jsx/.css, PortfolioEditorPage.jsx/.css
components/portfolio/
  CreatePortfolioModal.jsx, PortfolioTemplatePicker.jsx, PortfolioThumbnail.jsx,
  PortfolioPreview.jsx/.css
  editor/    DesignPanel.jsx/.css, FieldGroup.jsx, portfolioSectionConfig.js
  templates/ PortfolioDocument.jsx, PortfolioSections.jsx, portfolioRegistry.js,
             MinimalPortfolio.jsx, BoldPortfolio.jsx, SidebarPortfolio.jsx,
             portfolioTemplates.css
```

**Frontend – updated:** `hooks/useResumeEditor.js` (now uses the shared hook), `components/resume/editor/ListEditor.jsx` (optional `config` / `createItem`), `App.jsx` (2 routes), `layouts/DashboardLayout.jsx` (full width for the portfolio editor), `components/layout/Sidebar.jsx` ("Portfolio" enabled).

---

## 4. Installing Phase 6

1. Stop the backend and frontend.
2. Replace `backend/src`, `frontend/src`, `postman/` and `docs/` with the versions from the zip. Keep your `.env` files.
3. Run the tests:
   ```bash
   cd backend
   mvn test        # expected: Tests run: 53, Failures: 0, Errors: 0
   mvn spring-boot:run
   ```
   Hibernate creates the `portfolios` table.
4. `cd frontend && npm run dev` → **Portfolio** in the sidebar.

---

## 5. API reference (new in Phase 6)

All endpoints need `Authorization: Bearer <token>`.

| Method | Endpoint | Success | Body / notes |
|---|---|---|---|
| GET | `/api/portfolios` | 200 | List (newest first) with `primaryColor` and `colorMode` for thumbnails |
| POST | `/api/portfolios` | 201 | `{ "name", "templateId": "minimal\|bold\|sidebar", "prefillFromProfile": true }` |
| GET | `/api/portfolios/{id}` | 200 | Full portfolio incl. `design`, `content`, and the owner's `avatarPath` |
| PUT | `/api/portfolios/{id}` | 200 | `{ "name", "templateId", "design": {…}, "content": {…} }` (whole document) |
| POST | `/api/portfolios/{id}/duplicate` | 201 | Copy named "… (copy)" |
| DELETE | `/api/portfolios/{id}` | 204 | |

**Design values:** `primaryColor` `#rrggbb` · `colorMode` `LIGHT|DARK` · `fontPairing` `modern|editorial|tech|friendly` · `heroAlign` `LEFT|CENTER` · `projectLayout` `GRID|LIST`.

**Errors:** 400 for an unknown template, an invalid color or design value, a link without `http(s)://`, a date that isn't `YYYY-MM`, too much content, or more than 10 portfolios. Nested errors look like `"content.projects[0].liveUrl"` or `"design.primaryColor"`. 404 if the portfolio isn't yours.

---

## 6. Testing

### Postman
Import `postman/CareerCraft-Phase6.postman_collection.json` and run requests 1 → 9.

### Phase 6 testing checklist

**Backend**
- [ ] `mvn test` → 53 tests pass
- [ ] All Postman requests pass; the `portfolios` table exists

**List and create**
- [ ] Sidebar → **Portfolio** → empty state → "Create a portfolio"
- [ ] The dialog shows 3 live template thumbnails; the selected one is highlighted
- [ ] With "Fill it in from my profile", the new portfolio shows your name, headline, about, skills, experience, education and contact links
- [ ] Cards show the template in the portfolio's own colors; Duplicate and Delete work

**Content tab**
- [ ] Editing the hero name, headline and tagline updates the preview instantly
- [ ] "Status badge" text shows as a pill; clearing it hides it
- [ ] "Show my profile photo" shows your Phase 2 photo (or initials if you have none)
- [ ] Add skills with groups (e.g. Frontend / Backend) → grouped in the preview; without groups → one cloud
- [ ] Add 2 projects; mark one **Featured** → it moves first with a badge; links show "Live demo" / "Source code"
- [ ] A project screenshot URL shows the image; empty shows a tinted placeholder with initials
- [ ] A link without `https://` → inline error, status "Not saved"; fixing it saves
- [ ] Hide, rename and reorder sections → the preview and the nav links follow
- [ ] Status goes Unsaved → Saving… → Saved; refresh keeps everything

**Design tab**
- [ ] Switch Minimal / Bold / Sidebar → layout changes, content unchanged
- [ ] Each preset color and a custom color (color picker) update buttons, headings and badges
- [ ] Pick a very light custom color (e.g. #fde047) on Bold → hero text switches to dark for readability
- [ ] Dark mode → dark background, light text, readable cards
- [ ] Each font pairing visibly changes headings (the first switch may take a second to download)
- [ ] Hero alignment Center and projects as List both work

**Preview devices**
- [ ] Desktop → Tablet → Mobile: the preview narrows and layouts adapt (mobile: one-column projects, nav links hidden, Sidebar template becomes a header)
- [ ] Clicking links inside the preview does nothing (it doesn't leave the editor)

**Regression (Phase 3 refactor)**
- [ ] Open a **resume** → autosave, Save button, "← Resumes" and the unsaved-changes warning all still work
- [ ] Resume sections can still add / reorder / remove entries

**Responsive editor**
- [ ] Below ~1180px: Edit / Preview tabs replace the side-by-side view

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| Preview always looks like desktop | Your browser doesn't support container queries (very old). Use current Chrome, Edge, Firefox or Safari. |
| Fonts don't change | The Google Fonts request may be blocked (ad blocker, offline). The template falls back to system fonts. |
| Screenshot doesn't show | The image URL must be a direct, publicly reachable image link (ending in .png / .jpg / .webp usually). |
| Avatar shows initials | Upload a photo in **Profile → Personal info**, then reload the editor. |
| "You can have up to 10 portfolios" | Delete an old one, or raise `MAX_PORTFOLIOS_PER_USER` in `PortfolioService`. |
| `Data too long for column 'content'` | An old experimental `portfolios` table exists. `DROP TABLE portfolios;` and restart. |

If something else breaks, send me the error from the browser console or backend log and what you were doing.
