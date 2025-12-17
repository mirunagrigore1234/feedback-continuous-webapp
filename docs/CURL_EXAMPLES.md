# CURL Examples — Feedback Continuous Webapp

Create activity (teacher):

```bash
curl -X POST http://localhost:3000/activities \
  -H "Content-Type: application/json" \
  -d '{"title":"Seminar 1","description":"Intro","date":"2025-11-20T10:00:00Z","durationMinutes":60}'
```

Join activity (student):

```bash
curl -X POST http://localhost:3000/activities/{activityId}/join \
  -H "Content-Type: application/json" \
  -d '{"code":"ACCESSCODE123"}'
```

Submit feedback (student):

```bash
curl -X POST http://localhost:3000/activities/{activityId}/feedback \
  -H "Content-Type: application/json" \
  -d '{"mood":"happy","timestamp":"2025-11-20T10:15:00Z"}'
```

Get feedback timeline (teacher):

```bash
curl http://localhost:3000/activities/{activityId}/feedback
```
