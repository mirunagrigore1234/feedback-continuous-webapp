# TEST PLAN — Feedback Continuous Webapp

Scop: verificarea funcționalităților esențiale (creare activitate, join cu cod, trimitere feedback, vizualizare timeline).

Manual acceptance tests

1) Profesor creează activitate
   - Pași: Autentificare (dacă există), POST /activities cu titlu, descriere, dată, durată
   - Așteptări: 201 Created, răspuns conține `accessCode` și `id`.

2) Student se alătură folosind codul
   - Pași: POST /activities/{id}/join { code }
   - Așteptări: 200 OK, permite trimiterea de feedback pentru perioada activă.

3) Student trimite feedback anonim
   - Pași: POST /activities/{id}/feedback { mood, timestamp }
   - Așteptări: 201 Created, feedback salvat fără identificare personală.

4) Profesor vizualizează feedback-ul în timp real
   - Pași: GET /activities/{id}/feedback
   - Așteptări: 200 OK, listă de instanțe de feedback cu timestamp-uri.

Automated tests (recommendation)

- Backend unit tests: pentru generare cod, validare perioadă activitate, persistență feedback.
- Integration tests: pornire DB test (sqlite in-memory or test Postgres container), apeluri API (supertest/Jest).
- Frontend unit tests: componente principale (React Testing Library).
- Optional E2E: scripts Cypress care simulează profesor/student flows.

Metrics & coverage

- Target: >= 70% coverage initial, adăugați prag în pipeline.
