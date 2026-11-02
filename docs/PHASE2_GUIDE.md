# Phase 2 – User Dashboard and Profile Management

This guide explains what Phase 2 adds, how it works, how to install it on top of Phase 1, and how to test it.

---

## 1. What we're building

| Feature | Where |
|---|---|
| App shell: sidebar navigation + top bar with user menu | Every logged-in page |
| Dashboard overview: greeting, section counts, profile strength, profile snapshot | `/dashboard` |
| Profile editor with 5 tabs: Personal info, Education, Experience, Skills, Certifications | `/profile` (`/profile?tab=education` etc.) |
| Profile picture upload / change / remove | Personal info tab |
| Profile completion percentage with a "next steps" checklist | Dashboard, profile page, sidebar |
| Toast notifications, confirm-before-delete dialogs, loading and error states | Throughout |

No new libraries, no new environment variables.

---

## 2. How it works

### Data model

```
users (Phase 1)
  │ 1
  │
  │ 1
profiles ──────────────┬─────────────────┬──────────────────┬──────────────────────┐
  headline, phone,     │ 1..*            │ 1..*             │ 1..*                 │ 1..*
  location, about,     ▼                 ▼                  ▼                      ▼
  website/linkedin/  profile_education  profile_experience  profile_skills  profile_certifications
  github URLs

users 1 ── 0..1 profile_pictures   (image bytes, kept in a separate table)
```

Hibernate creates all six new tables automatically (`ddl-auto: update`) the first time you start the backend.

**Profile is the "aggregate root".** Education, experience, skills and certifications are always changed *through* the profile (`cascade = ALL, orphanRemoval = true`). Removing an item from `profile.getEducation()` deletes its row, so there's no separate repository for each child table.

**Every account has exactly one profile.**
- New users get an empty profile in the same transaction as registration (`AuthService.register`).
- Accounts you created during Phase 1 get one at startup from `ProfileBackfillRunner`. You'll see `Created empty profiles for N existing user(s)` in the log once.

### Security: you can only edit your own data

The user id always comes from the **JWT** (`@AuthenticationPrincipal`), never from the URL. To edit `/api/profile/education/42`, the service looks for id 42 **inside your own profile's list**. If entry 42 belongs to someone else, it simply isn't found and you get a **404**. This prevents a classic vulnerability called IDOR (Insecure Direct Object Reference). The test `usersCannotEditEachOthersEntries` proves it.

### Every change returns the full profile

Every profile endpoint (add, edit, delete, upload…) returns the complete updated `ProfileResponse`, including the recalculated completion percentage. The frontend just replaces its copy, so:
- the completion ring, sidebar meter, tab counts and dashboard are always in sync;
- no client-side recalculation or list merging, which means fewer bugs.

The trade-off is a slightly larger response. For a profile it's a few KB, which is negligible.

### Profile pictures are stored in MySQL

Render and Railway give your backend an **ephemeral filesystem**: anything written to disk vanishes on the next deploy or restart. So instead of saving uploads to a folder, the image bytes go into the `profile_pictures` table (max 2 MB). It's kept in its own table so loading a profile never loads image bytes.

- **Upload:** `POST /api/profile/picture` (multipart). The server checks the file's first bytes (its "magic number") to make sure it really is a JPEG, PNG or WEBP. It doesn't trust the file name or the browser's Content-Type.
- **Display:** `GET /api/users/{id}/avatar?v=<timestamp>` is **public**. That's because an `<img src>` tag can't send an `Authorization` header, and public portfolios will need avatars later anyway. The `?v=` value changes on each upload, so the browser can cache the image for 30 days and still shows a new photo immediately.

### Profile completion (calculated on the backend)

| Item | Weight | Done when |
|---|---|---|
| Profile photo | 10 | a picture is uploaded |
| Headline | 10 | not empty |
| About / bio | 10 | not empty |
| Contact | 10 | phone **and** location |
| Links | 10 | LinkedIn, GitHub **or** website |
| Education | 15 | at least 1 entry |
| Experience | 15 | at least 1 entry |
| Skills | 10 | at least 3 skills |
| Certifications | 10 | at least 1 entry |
| **Total** | **100** | |

The calculation lives in `ProfileCompletionCalculator` so every client gets the same number. Each item carries a `section` (e.g. `education`), which the UI uses to link straight to the right tab.

### Frontend architecture

```
DashboardLayout  (sidebar + top bar)
 └─ ProfileProvider  ← loads GET /api/profile once, shares it with all pages below
     ├─ Sidebar           (profile strength meter)
     ├─ Topbar            (avatar + name come from AuthContext, kept in sync by ProfileProvider)
     └─ <Outlet/>
         ├─ DashboardPage (stats, completion card, snapshot)
         └─ ProfilePage   (tabs → PersonalInfoForm, AvatarUploader, EducationSection,
                           ExperienceSection, SkillsEditor, CertificationSection)
```

- **`useProfile().save(request)`** runs an API call and stores the returned profile. Every form uses it.
- **`SectionManager`** is one reusable component handling the list, the add/edit modal and delete confirmation. Education, Experience and Certifications each pass it a small config (form fields, validation, and how to display a card), so that logic is written once.
- **`?tab=` in the URL** controls the active profile tab, so links like "Add your education" open the right tab, and refresh or back keeps it.
- **Dates** use month pickers (`2023-06`). They're sent to the API as `2023-06-01` and shown as "Jun 2023 – Present".
- **Axios change:** the default `Content-Type: application/json` header was removed. Axios sets JSON automatically for objects. A hard-coded JSON header would break the file upload, which needs `multipart/form-data` with a boundary that the browser generates.

---

## 3. Files in this phase

**Backend – new**

```
entity/      Profile, Education, Experience, Skill, SkillLevel, Certification, ProfilePicture
repository/  ProfileRepository, ProfilePictureRepository
dto/request/ PersonalInfoRequest, EducationRequest, ExperienceRequest, CertificationRequest,
             SkillRequest, SkillsUpdateRequest
dto/response/ ProfileResponse, PersonalInfoResponse, EducationResponse, ExperienceResponse,
             SkillResponse, CertificationResponse, ProfileCompletionResponse
service/     ProfileService, ProfilePictureService, ProfileMapper,
             ProfileCompletionCalculator, ProfileBackfillRunner
controller/  ProfileController
exception/   InvalidRequestException
util/        TextUtils
test/        ProfileControllerIntegrationTest
```

**Backend – updated** (complete files are in the zip)

| File | Change |
|---|---|
| `controller/UserController.java` | + public `GET /api/users/{id}/avatar` |
| `config/SecurityConfig.java` | permits `GET /api/users/*/avatar` |
| `service/AuthService.java` | creates the profile on register; uses `UserService.toResponse` |
| `service/UserService.java` | adds `avatarPath` to user responses |
| `dto/response/UserResponse.java` | + `avatarPath` field |
| `repository/UserRepository.java` | + `findUsersWithoutProfile()` |
| `exception/GlobalExceptionHandler.java` | + handlers for business validation, uploads, bad ids, content type |
| `resources/application.yml` | + multipart size limits |
| `test/AuthControllerIntegrationTest.java` | cleans up new tables; + "register creates profile" test |

**Frontend – new**

```
layouts/DashboardLayout.jsx/.css
components/layout/  Sidebar, Topbar (+ .css)
components/common/  Avatar, Checkbox, Modal, ConfirmDialog, EmptyState, LoadingBlock,
                    ProgressRing, PageHeader, Toast.css
components/profile/ ProfileCompletionCard, AvatarUploader, PersonalInfoForm, SectionManager,
                    EntryCard, EducationSection, ExperienceSection, CertificationSection,
                    SkillsEditor, ProfileForms.css
context/            ProfileContext.jsx, ToastContext.jsx
hooks/              useProfile.js, useToast.js
api/profileService.js
utils/date.js
pages/dashboard/DashboardPage.jsx/.css
pages/profile/ProfilePage.jsx/.css
```

**Frontend – updated:** `App.jsx` (layout routes, `/profile`), `main.jsx` (ToastProvider), `api/axios.js` (no default content type, `buildApiUrl`), `context/AuthContext.jsx` (+ `updateUser`), `utils/validators.js` (+ profile validators), `components/common/Button.*` (sizes `sm`, `danger` variant, icon-only), `components/common/FormInput.*` (textarea/select, counter, "Optional" label), `styles/global.css` (+ `.card` classes).

**Frontend – deleted:** `src/pages/home/` (the temporary Phase 1 page; its content now lives in the dashboard and top bar).

---

## 4. Installing Phase 2 on top of Phase 1

1. **Stop** the backend and the frontend dev server.
2. Unzip `careercraft.zip` somewhere temporary.
3. **Replace** these folders in your project with the ones from the zip:
   - `backend/src`
   - `frontend/src`
   - `postman/`
   - `docs/`
4. Keep your own `backend/.env` and `frontend/.env`. Nothing new is needed in them.
5. Make sure `frontend/src/pages/home/` no longer exists (replacing `frontend/src` takes care of this).

`pom.xml` and `package.json` didn't change, so there's nothing new to install.

### Run the tests

```bash
cd backend
mvn test
```

Expected: **`Tests run: 22, Failures: 0, Errors: 0`** (10 auth tests + 12 profile tests) and `BUILD SUCCESS`.

### Start everything

```bash
# terminal 1
cd backend
mvn spring-boot:run

# terminal 2
cd frontend
npm run dev
```

In the backend log on first start you should see `Created empty profiles for 1 existing user(s)` (or however many accounts you made in Phase 1).

In MySQL, `SHOW TABLES FROM careercraft;` now lists `profiles`, `profile_education`, `profile_experience`, `profile_skills`, `profile_certifications` and `profile_pictures` alongside `users`.

---

## 5. API reference (new in Phase 2)

All `/api/profile` endpoints need `Authorization: Bearer <token>` and return the **full `ProfileResponse`**.

| Method | Endpoint | Success | Notes |
|---|---|---|---|
| GET | `/api/profile` | 200 | |
| PUT | `/api/profile/personal` | 200 | Also updates your full name |
| POST | `/api/profile/picture` | 200 | `multipart/form-data`, field `file`; JPG/PNG/WEBP ≤ 2 MB |
| DELETE | `/api/profile/picture` | 200 | |
| POST | `/api/profile/education` | 201 | |
| PUT | `/api/profile/education/{id}` | 200 | 404 if not yours |
| DELETE | `/api/profile/education/{id}` | 200 | 404 if not yours |
| POST / PUT / DELETE | `/api/profile/experience[/{id}]` | 201 / 200 / 200 | same pattern |
| POST / PUT / DELETE | `/api/profile/certifications[/{id}]` | 201 / 200 / 200 | same pattern |
| PUT | `/api/profile/skills` | 200 | Replaces the whole list; duplicates (case-insensitive) dropped; max 50 |
| GET | `/api/users/{id}/avatar` | 200 | **Public**; image bytes |

`GET /api/users/me` and the login/register responses now include `avatarPath`.

**Validation highlights:** URLs must start with `http://` or `https://`. End dates are required unless "current" is ticked, and can't be before the start date. Certification expiry can't be before the issue date. Each list holds at most 20 entries. Errors use the same JSON format as Phase 1, with `fieldErrors` keyed by the field name the form uses.

**Example `ProfileResponse` (shortened)**

```json
{
  "personal": { "fullName": "Asha Verma", "email": "asha@example.com", "headline": "…",
                "phone": "…", "location": "…", "about": "…", "websiteUrl": null,
                "linkedinUrl": "…", "githubUrl": "…", "avatarPath": "/users/1/avatar?v=1762140000000" },
  "education": [ { "id": 3, "institution": "…", "degree": "B.E.", "startDate": "2022-08-01",
                   "endDate": null, "currentlyStudying": true, … } ],
  "experience": [ … ],
  "skills": [ { "id": 7, "name": "React", "level": "ADVANCED" } ],
  "certifications": [ … ],
  "completion": { "percentage": 65,
                  "items": [ { "key": "photo", "label": "Add a profile photo", "section": "personal",
                               "weight": 10, "completed": true }, … ] },
  "updatedAt": "2026-11-03T06:10:00Z"
}
```

---

## 6. Testing with Postman

1. Import `postman/CareerCraft-Phase2.postman_collection.json`.
2. If your Phase 1 account isn't `asha@example.com` / `secret123`, edit the body of request **1. Login**.
3. Before request **10. Upload profile picture**, open its **Body** tab and choose an image file in the `file` row.
4. Run requests 1 → 16 in order. The collection uses Bearer auth with `{{token}}` automatically; requests 3 and 11 deliberately send no token.

| # | Expected |
|---|---|
| 2 | 200 with `completion` |
| 3 | 401 (no token) |
| 4 | 200, completion goes up |
| 5 | 400 with `fieldErrors.fullName` and `fieldErrors.linkedinUrl` |
| 6 / 7 | 201 / 200 |
| 8 | 400 with `fieldErrors.endDate` |
| 9 | 201 |
| 10 | 200 with `personal.avatarPath` |
| 11 | 200 and the image is displayed in Postman (no token used) |
| 12 / 13 | 200 / 201 |
| 14 | completion ≥ 90% (100% with a photo) |
| 15 | 200 |
| 16 | 404 (already deleted) |

Also try uploading a `.txt` file renamed to `.png` → **400** "Only JPG, PNG or WEBP images are allowed". The server checks the real content, not the extension.

---

## 7. Phase 2 testing checklist

**Backend**
- [ ] `mvn test` → 22 tests pass
- [ ] Six new tables exist in MySQL
- [ ] All Postman requests return the expected status
- [ ] A disguised non-image upload is rejected with 400

**Navigation & layout**
- [ ] After login you land on `/dashboard` with the sidebar and top bar
- [ ] Sidebar highlights the current page; "Coming soon" items are not clickable
- [ ] Top bar menu → "My profile" goes to `/profile`; "Log out" returns to `/login`
- [ ] Below ~1024px the sidebar hides; the ☰ button opens it as a drawer; clicking outside or navigating closes it
- [ ] On a phone-width screen nothing scrolls sideways

**Dashboard**
- [ ] Greeting shows your first name and the right time of day
- [ ] The four stat cards show correct counts and open the matching profile tab
- [ ] Profile strength ring matches the percentage in the sidebar
- [ ] Clicking an unfinished checklist item opens the right profile tab

**Profile – personal info**
- [ ] Upload a JPG/PNG → avatar appears in the form, top bar and dashboard
- [ ] Choose a file over 2 MB or a PDF → clear error, nothing uploaded
- [ ] Remove photo → initials shown again; completion drops by 10
- [ ] Edit fields → "unsaved changes"; Discard restores; Save shows a toast
- [ ] Changing your full name updates the top bar immediately
- [ ] `linkedin.com/in/x` (no https) → inline URL error
- [ ] About shows a live character counter

**Profile – education / experience / certifications**
- [ ] Empty state shows with an "Add" button
- [ ] Add an entry → modal closes, toast, card appears, tab count increases, completion updates
- [ ] Ticking "I currently study/work here" disables End date and shows "Present" on the card
- [ ] End date before start date → inline error on End date
- [ ] Edit an entry → modal is pre-filled; Save updates the card
- [ ] Delete → confirmation dialog; Cancel keeps it; Delete removes it
- [ ] Press Escape or click the backdrop → modal closes

**Profile – skills**
- [ ] Type a skill and press Enter → chip appears (not saved yet: "Unsaved changes")
- [ ] Adding the same skill twice (any case) → "You already added this skill"
- [ ] Change a level from the chip's dropdown; the dots update
- [ ] Save skills → toast; refresh the page → skills are still there
- [ ] Discard reverts to the saved list

**General**
- [ ] Refresh on `/profile?tab=experience` → stays on the Experience tab
- [ ] Stop the backend and reload the dashboard → error state with "Try again"

---

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| Startup error mentioning `profiles` / foreign key | Usually leftover tables from an experiment. In MySQL, `DROP` the six `profile*` tables and restart; Hibernate recreates them. |
| Upload returns **413** | File is over 2 MB. |
| Upload returns **415** or 400 "Invalid file upload" | In Postman, Body must be **form-data** with key `file` set to type **File**. Don't add a `Content-Type` header manually. |
| Uploading in the browser gives 400 "Request body is missing or malformed" | You still have the old `axios.js` with the default JSON header. Use the Phase 2 version. |
| Avatar shows initials even after upload | Check the browser Network tab for `/api/users/{id}/avatar`. A 404 means no picture saved; a CORS or mixed-content error means `VITE_API_BASE_URL` is wrong. |
| `Packet for query is too large` when uploading | Your MySQL `max_allowed_packet` is unusually small. Set it to at least 16M in MySQL's config and restart MySQL. |
| Month picker looks like a plain text box | Some browsers (older Safari) don't support `type="month"`. Type the date as `2024-06`. |
| `Cannot read properties of null (reading 'personal')` | The profile request failed. Check the backend is running and look at the Network tab. |
| Sidebar overlaps content on desktop | Hard-refresh (Ctrl/Cmd+Shift+R) to clear old CSS. |

If something else breaks, send me the full error (backend log or browser console) and the step you were on.
