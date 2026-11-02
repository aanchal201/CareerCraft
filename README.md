# CareerCraft – AI Resume & Portfolio Builder

A full-stack career platform: React + Vite (plain CSS) frontend, Spring Boot 3 / Java 21 backend, MySQL, JWT auth, and Grok (xAI) for AI features (from Phase 5).

## Progress

| Phase | Status | Guide |
|---|---|---|
| 1 – Project setup & authentication | ✅ Done | [docs/PHASE1_GUIDE.md](docs/PHASE1_GUIDE.md) |
| 2 – Dashboard & profile management | ✅ Done | [docs/PHASE2_GUIDE.md](docs/PHASE2_GUIDE.md) |
| 3 – Resume builder | ✅ Done | [docs/PHASE3_GUIDE.md](docs/PHASE3_GUIDE.md) |
| 4 – PDF generation | ✅ Done | [docs/PHASE4_GUIDE.md](docs/PHASE4_GUIDE.md) |
| 5 – AI resume analyzer (Grok) | ✅ Done | [docs/PHASE5_GUIDE.md](docs/PHASE5_GUIDE.md) |
| 6 – Portfolio builder | ✅ Done | [docs/PHASE6_GUIDE.md](docs/PHASE6_GUIDE.md) |
| 7 – AI portfolio generator & publishing | ✅ Done | [docs/PHASE7_GUIDE.md](docs/PHASE7_GUIDE.md) |
| 8 – Job tracker & career tools | ⏭️ Skipped for now | |
| 9 – Testing, security & deployment | 🧪 Ready to test | [docs/PHASE9_GUIDE.md](docs/PHASE9_GUIDE.md) |

## Quick start

```bash
# backend (needs MySQL running and backend/.env filled in - see Phase 1 guide)
cd backend
mvn test              # 84 tests (H2 + mocked AI - no MySQL/API key needed)
mvn spring-boot:run

# frontend (needs frontend/.env - copy from .env.example)
cd frontend
npm install
npm test              # 22 unit tests
npm run dev
```

App: <http://localhost:5173> · API: <http://localhost:8080/api/health>

Postman collections for each phase are in `postman/`.

## Deployment

| Part | Host | Config |
|---|---|---|
| Frontend | Vercel (Root Directory `frontend`) | `frontend/vercel.json`, env `VITE_API_BASE_URL` |
| Backend | Render via Blueprint (or Railway) | `render.yaml`, `backend/Dockerfile` |
| Database | MySQL on Aiven (free) or Railway | `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` |
| CI | GitHub Actions | `.github/workflows/ci.yml` |

Step-by-step instructions and the go-live checklist: [docs/PHASE9_GUIDE.md](docs/PHASE9_GUIDE.md).

All secrets (database password, `JWT_SECRET`, `GROK_API_KEY`) are environment variables on the server - never in the code or the frontend.
