# CareerCraft – AI Resume & Portfolio Builder

**Current phase: Phase 1 – Project Setup and Authentication**

This guide explains what Phase 1 builds, how it works, how to set it up, and how to test it.
Read it top to bottom the first time.

---

## 1. Phase 1 objectives

By the end of this phase you will have:

1. A **React + Vite** frontend and a **Spring Boot (Java 21)** backend in one project.
2. A **MySQL** database the backend connects to (the `users` table is created automatically).
3. **Registration** and **login** APIs with input validation.
4. **Password hashing** with BCrypt (plain-text passwords are never stored).
5. **JWT authentication** – the backend issues a signed token, the frontend sends it on every request.
6. **Spring Security** configured for a stateless REST API, with JSON error responses.
7. **Protected routes** in React (`/dashboard` needs a login; `/login` and `/register` are for logged-out users).
8. A polished **login / registration UI** built with plain CSS.
9. **Logout**.
10. A **Postman collection** and **automated tests** to prove it all works.

AI (Grok) is **not** used in Phase 1. Its configuration slots are already reserved (`GROK_API_KEY`, `GROK_BASE_URL`, `GROK_MODEL`) and will be wired up in Phase 5 — always through the backend, so the key never reaches the browser.

---

## 2. Architecture overview

```
 Browser (React + Vite, :5173)                     Spring Boot API (:8080)                    MySQL (:3306)
 ┌──────────────────────────────┐   HTTPS/JSON    ┌───────────────────────────────────┐      ┌─────────────┐
 │ Pages (Login, Register, Home)│ ──────────────► │ JwtAuthenticationFilter           │      │             │
 │ AuthContext (user, token)    │  Authorization: │   ↓ (validates Bearer token)      │      │  users      │
 │ ProtectedRoute / PublicRoute │  Bearer <JWT>   │ SecurityFilterChain (rules)       │      │  table      │
 │ authService → axios instance │ ◄────────────── │   ↓                               │ JPA  │             │
 │ localStorage (token)         │   JSON / errors │ Controller → Service → Repository │ ───► │             │
 └──────────────────────────────┘                 │ GlobalExceptionHandler (errors)   │      └─────────────┘
                                                  └───────────────────────────────────┘
```

**Backend layers (separation of concerns)**

| Layer | Package | Responsibility |
|---|---|---|
| Controller | `controller` | HTTP only: map URLs, validate request bodies, return status codes |
| Service | `service` | Business logic: register, login, look up users |
| Repository | `repository` | Database access via Spring Data JPA |
| Entity | `entity` | Java classes mapped to tables (`User`) |
| DTO | `dto.request`, `dto.response` | Shapes of JSON coming in / going out (never expose entities directly) |
| Security | `security`, `config` | JWT creation/validation, filter, Spring Security rules, CORS |
| Exceptions | `exception` | One place that turns exceptions into consistent JSON errors |

### How login works end to end

1. User submits the login form → `AuthContext.login()` → `authService.login()` → `POST /api/auth/login`.
2. `AuthController` validates the body (`@Valid`) and calls `AuthService.login()`.
3. `AuthenticationManager` loads the user via `CustomUserDetailsService` and compares the password against the BCrypt hash.
4. On success, `JwtService` creates a token signed with `JWT_SECRET` (contains email, user id, role, expiry).
5. The API returns `{ accessToken, tokenType, expiresIn, user }`.
6. The frontend stores the token in `localStorage` and the user in React state; `PublicRoute` sees you're logged in and redirects to `/dashboard`.

### How a protected request works

1. The Axios request interceptor adds `Authorization: Bearer <token>`.
2. `JwtAuthenticationFilter` verifies the signature and expiry, loads the user, and marks the request as authenticated.
3. Spring Security's rules allow the request; `UserController` receives the logged-in user via `@AuthenticationPrincipal`.
4. If the token is missing/invalid/expired → `RestAuthenticationEntryPoint` returns **401 JSON** → the Axios response interceptor fires a logout event → the user is sent to `/login`.

### Why logout is done on the client

JWTs are **stateless**: the server doesn't keep a list of sessions, it only checks the signature and expiry. "Logging out" therefore means the browser deletes its token. The token would technically stay valid until it expires (24 h by default) if someone had copied it. That's an accepted trade-off for this stage; in Phase 9 we'll review hardening options (shorter expiry, refresh tokens, or a token denylist).

### Why the token is in `localStorage`

It's simple and works well with a separate frontend and backend domain (Vercel + Render). The trade-off: any JavaScript running on the page can read it, so XSS protection matters. React escapes output by default, and we never inject raw HTML. We'll revisit this (httpOnly cookies) during the Phase 9 security review.

---

## 3. Folder structure

```
careercraft/
├── README.md                          ← this guide
├── postman/
│   └── CareerCraft-Phase1.postman_collection.json
├── backend/
│   ├── pom.xml                        ← Maven dependencies
│   ├── .env.example                   ← copy to .env and fill in
│   └── src/
│       ├── main/
│       │   ├── java/com/careercraft/
│       │   │   ├── CareerCraftApplication.java
│       │   │   ├── config/SecurityConfig.java
│       │   │   ├── controller/  AuthController, UserController, HealthController
│       │   │   ├── dto/request/ RegisterRequest, LoginRequest
│       │   │   ├── dto/response/ AuthResponse, UserResponse, ApiErrorResponse
│       │   │   ├── entity/      User, Role
│       │   │   ├── exception/   GlobalExceptionHandler, EmailAlreadyExistsException, ResourceNotFoundException
│       │   │   ├── repository/  UserRepository
│       │   │   ├── security/    JwtService, JwtAuthenticationFilter, CustomUserDetailsService,
│       │   │   │                UserPrincipal, RestAuthenticationEntryPoint, RestAccessDeniedHandler
│       │   │   └── service/     AuthService, UserService
│       │   └── resources/application.yml
│       └── test/
│           ├── java/com/careercraft/AuthControllerIntegrationTest.java
│           └── resources/application-test.yml
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env.example                   ← copy to .env
    ├── public/favicon.svg
    └── src/
        ├── main.jsx                   ← entry: Router + AuthProvider
        ├── App.jsx                    ← route map
        ├── api/        axios.js (configured instance), authService.js
        ├── context/    AuthContext.jsx
        ├── hooks/      useAuth.js
        ├── routes/     ProtectedRoute.jsx, PublicRoute.jsx
        ├── components/
        │   ├── common/ Button, FormInput, Alert, Spinner, FullPageLoader, Logo (+ .css each)
        │   └── auth/   AuthLayout, PasswordStrength (+ .css each)
        ├── pages/
        │   ├── auth/   LoginPage.jsx, RegisterPage.jsx, AuthForm.css
        │   ├── home/   HomePage.jsx (temporary protected page; becomes the dashboard in Phase 2)
        │   └── NotFoundPage.jsx
        ├── styles/     variables.css (design tokens), global.css
        └── utils/      storage.js, validators.js
```

Every component has its own CSS file next to it, and all colors/spacing come from `styles/variables.css`, so the design stays consistent as the app grows.

---

## 4. Required software

| Tool | Version | Check with |
|---|---|---|
| JDK | 21 | `java -version` |
| Maven | 3.9+ (or the one bundled in IntelliJ) | `mvn -v` |
| Node.js | 20.19+ or 22.12+ (required by Vite 7) | `node -v` |
| npm | comes with Node | `npm -v` |
| MySQL Server | 8.x | `mysql --version` |
| Postman | latest | — |
| IDE | IntelliJ IDEA (backend) + VS Code (frontend) recommended | — |

**Backend dependencies** (already in `pom.xml`): Spring Boot 3.5 starters for Web, Security, Data JPA and Validation; MySQL Connector/J; JJWT 0.12.6 (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`); and for tests only: spring-boot-starter-test, spring-security-test, H2.

**Frontend dependencies** (already in `package.json`): react, react-dom, react-router-dom, axios, lucide-react; dev: vite, @vitejs/plugin-react.

---

## 5. Step-by-step setup

### Step 1 – Put the project in place

Unzip `careercraft.zip` wherever you keep projects. You'll have `careercraft/backend` and `careercraft/frontend`.

### Step 2 – Create the MySQL database user

Open a MySQL shell (`mysql -u root -p`) or MySQL Workbench and run:

```sql
CREATE DATABASE IF NOT EXISTS careercraft CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'careercraft_user'@'localhost' IDENTIFIED BY 'choose_a_strong_password';
GRANT ALL PRIVILEGES ON careercraft.* TO 'careercraft_user'@'localhost';
FLUSH PRIVILEGES;
```

Using a dedicated user (instead of `root`) is good practice and mirrors how hosted databases work.

### Step 3 – Configure the backend `.env`

```bash
cd careercraft/backend
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
```

Generate a JWT secret:

```bash
openssl rand -base64 64
```

No `openssl` on Windows? Use PowerShell:

```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

Edit `backend/.env`:

```properties
DB_URL=jdbc:mysql://localhost:3306/careercraft?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=careercraft_user
DB_PASSWORD=choose_a_strong_password
JWT_SECRET=<paste the generated value on ONE line>
JWT_EXPIRATION_MS=86400000
CORS_ALLOWED_ORIGINS=http://localhost:5173
JPA_DDL_AUTO=update
```

How this works: `application.yml` contains `spring.config.import: optional:file:.env[.properties]`, so Spring reads `.env` from the folder you start the app in. On Render/Railway you'll set real environment variables instead — no code change needed.

### Step 4 – Run the backend tests (no MySQL needed)

```bash
cd careercraft/backend
mvn test
```

These tests use an in-memory H2 database and check registration, hashing, duplicates, validation, login, and token-protected access. You should see `Tests run: 9, Failures: 0, Errors: 0` and `BUILD SUCCESS`.

### Step 5 – Start the backend

```bash
mvn spring-boot:run
```

Look for `Tomcat started on port 8080`. Then open <http://localhost:8080/api/health> — you should see `{"status":"UP", ...}`.

In MySQL, `SHOW TABLES FROM careercraft;` now shows a `users` table created by Hibernate.

**IntelliJ users:** open the `backend` folder (not the parent), let Maven import, then run `CareerCraftApplication`. Make sure the run configuration's *Working directory* is the `backend` folder, otherwise `.env` won't be found.

### Step 6 – Configure and start the frontend

In a second terminal:

```bash
cd careercraft/frontend
cp .env.example .env          # contains VITE_API_BASE_URL=http://localhost:8080/api
npm install
npm run dev
```

Open <http://localhost:5173>.

> Only variables starting with `VITE_` reach the browser, and anything in the frontend bundle is public. That's why the Grok API key lives **only** in `backend/.env`.

---

## 6. API reference (Phase 1)

Base URL: `http://localhost:8080/api`

| Method | Endpoint | Auth | Success | Errors |
|---|---|---|---|---|
| GET | `/health` | Public | 200 | — |
| POST | `/auth/register` | Public | 201 + AuthResponse | 400 validation, 409 email exists |
| POST | `/auth/login` | Public | 200 + AuthResponse | 400 validation, 401 bad credentials |
| GET | `/users/me` | Bearer token | 200 + UserResponse | 401 missing/invalid/expired token |

**Register request**

```json
{ "fullName": "Asha Verma", "email": "asha@example.com", "password": "secret123" }
```

Rules: name 2–100 chars; valid email ≤150 chars; password 8–72 chars with at least one letter and one number.

**AuthResponse**

```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": { "id": 1, "fullName": "Asha Verma", "email": "asha@example.com", "role": "USER", "createdAt": "2026-11-03T05:30:00Z" }
}
```

**Error format (all errors)**

```json
{
  "timestamp": "2026-11-03T05:31:10Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/auth/register",
  "fieldErrors": { "email": "Please enter a valid email address" }
}
```

The frontend reads `message` for the banner and `fieldErrors` to highlight specific inputs.

---

## 7. Testing with Postman

1. Postman → **Import** → choose `postman/CareerCraft-Phase1.postman_collection.json`.
2. Make sure the backend is running.
3. Run requests **1 → 9 in order** (or use *Run collection*). Register and Login automatically save the token into the `{{token}}` variable.

| # | Request | Expected |
|---|---|---|
| 1 | Health check | 200, `status: UP` |
| 2 | Register | 201, token returned, no password in response |
| 3 | Register same email again | 409 |
| 4 | Register invalid input | 400 with `fieldErrors` for fullName, email, password |
| 5 | Login | 200, token returned |
| 6 | Login wrong password | 401, "Invalid email or password" |
| 7 | `/users/me` with token | 200, your user |
| 8 | `/users/me` without token | 401 |
| 9 | `/users/me` with tampered token | 401 |

If you want to run step 2 again later, change the email (or delete the row in MySQL).

Bonus: paste a token into <https://jwt.io> to see what's inside it (email, uid, role, iat, exp). Notice it's **readable** but can't be **changed** without breaking the signature — which is why we never put secrets in a JWT.

---

## 8. Phase 1 testing checklist

**Backend**

- [ ] `mvn test` → 9 tests pass
- [ ] Backend starts without errors; `/api/health` returns UP
- [ ] `users` table exists in MySQL
- [ ] All 9 Postman requests return the expected status
- [ ] In MySQL, `SELECT email, password_hash FROM users;` shows a hash starting with `$2a$` / `$2b$`, not your password

**Frontend**

- [ ] `http://localhost:5173` redirects to `/login` when logged out
- [ ] Register with empty fields → inline errors, no request sent
- [ ] Register with mismatched passwords → "Passwords do not match"
- [ ] Password strength meter reacts as you type
- [ ] Successful registration → lands on `/dashboard` showing your name and email
- [ ] Register again with the same email → red banner "An account with email ... already exists"
- [ ] Logout → back to `/login`; visiting `/dashboard` redirects to `/login`
- [ ] Login with a wrong password → "Invalid email or password"
- [ ] Login with correct details → `/dashboard`
- [ ] Refresh the page on `/dashboard` → you stay logged in
- [ ] While logged in, visiting `/login` sends you to `/dashboard`
- [ ] DevTools → Application → Local Storage: delete `careercraft_token`, refresh → back to `/login`
- [ ] Edit the token in Local Storage (add a character), refresh → you get logged out
- [ ] Stop the backend and try logging in → "Cannot reach the server. Make sure the backend is running."
- [ ] Resize to mobile width → brand panel hides, form becomes a card, nothing overflows
- [ ] Visit `/some-random-page` → 404 page

---

## 9. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `Could not resolve placeholder 'DB_URL'` (or `JWT_SECRET`) | `.env` not found. Run from the `backend` folder, or set IntelliJ's working directory to `backend`. Check the file is named exactly `.env`. |
| `JWT_SECRET must decode to at least 32 bytes` | Secret too short or not Base64. Regenerate with `openssl rand -base64 64` and keep it on one line. |
| `Access denied for user 'careercraft_user'@'localhost'` | Password in `.env` doesn't match Step 2, or GRANT wasn't run. |
| `Communications link failure` | MySQL isn't running or isn't on port 3306. |
| `Public Key Retrieval is not allowed` | Make sure `allowPublicKeyRetrieval=true` is in `DB_URL`. |
| Browser console: **CORS error** | Frontend must run on `http://localhost:5173` (exactly what's in `CORS_ALLOWED_ORIGINS`). Restart the backend after changing `.env`. |
| "Cannot reach the server" in the UI | Backend not running, or `VITE_API_BASE_URL` wrong. Restart `npm run dev` after editing `frontend/.env`. |
| `Port 8080 already in use` | Stop the other process, or set `PORT=8081` in `backend/.env` and update `VITE_API_BASE_URL`. |
| `Port 5173 is already in use` | Another Vite app is running; stop it (port is fixed so CORS keeps working). |
| Maven can't find Java 21 | Set `JAVA_HOME` to your JDK 21, or pick JDK 21 in IntelliJ → Project Structure. |
| `npm install` fails on Node version | Upgrade Node to 20.19+ or 22.12+. |
| Two `/users/me` calls on page load in dev | Normal: React StrictMode runs effects twice in development only. |

If something else breaks, send me the **full error message** (and which step you were on) and we'll fix it before moving on.
