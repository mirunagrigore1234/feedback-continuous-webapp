# Continuous Feedback WebApp

## Descriere
Aplicație web pentru acordarea de feedback continuu la cursuri și seminarii. Studenții reacționează prin emoticoane, iar profesorii vizualizează feedback anonim în timp real sau ulterior.

## Structura proiectului
continuous-feedback-app/
├─ docs/       # Documentație și specificații
├─ frontend/   # Cod frontend React.js
├─ backend/    # Cod backend Node.js
└─ README.md

## Tehnologii
- Frontend: React.js (SPA)
- Backend: Node.js (REST API)
- Bază de date relațională (MySQL/PostgreSQL) accesată prin ORM
- Versionare: Git/GitHub

## Echipa
- Ana-Miruna Grigore
- Daria-Maria Marica
- Mara-Catinca Marinescu
- Profesor coordonator: [nume profesor]

## Instrucțiuni
Quick setup (development):

1. Copy env example and edit values:

```powershell
cp .env.example .env
```

2. Start services with Docker Compose (requires Docker):

```powershell
docker-compose up --build
```

3. Backend will be available at `http://localhost:3000` (if configured so).

Useful files added (see `docs/` and repo root):

- `docs/openapi.yaml` — OpenAPI/Swagger spec for core endpoints
- `.env.example` — example environment variables
- `backend/Dockerfile` — Dockerfile for backend service
- `docker-compose.yml` — compose to run Postgres + backend
- `docs/TEST_PLAN.md` — manual + recommended automated tests
- `backend/tests/api.test.js` — test stub (Jest + supertest)
- `docs/CURL_EXAMPLES.md` — curl commands for manual testing

