import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import {
  createActivity,
  getActivities,
  getActivityById,
  getActivityByCode,
  deleteActivity,
  updateActivity,
} from "../dataAccess/ActivityDA.js";

const activityRouter = express.Router();

const CODE_REGEX = /^[A-Z0-9]{6}$/;

function getTeacherId(req) {
  // ajustează aici dacă în JWT ai alt nume de câmp (ex: sub / userId)
  return req.teacher?.id ?? req.teacher?.TeacherId ?? req.teacher?.ProfessorId;
}

function requireTeacherId(req, res) {
  const teacherId = getTeacherId(req);
  if (!teacherId) {
    res.status(401).json({ message: "missing teacher id" });
    return null;
  }
  return teacherId;
}

function normalizeCreatePayload(body) {
  // Acceptă și camelCase, și PascalCase (ca să nu-ți pice din cauza frontend-ului)
  const Title = body.Title ?? body.title;
  const Description = body.Description ?? body.description;
  const AccessCode = (body.AccessCode ?? body.accessCode ?? "").toString().toUpperCase();
  const StartTime = body.StartTime ?? body.startTime ?? body.start_time;
  const EndTime = body.EndTime ?? body.endTime ?? body.end_time;

  return { Title, Description, AccessCode, StartTime, EndTime };
}

/* =========================
   CREATE (professor)
   POST /api/activities
   ========================= */
activityRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const teacherId = requireTeacherId(req, res);
    if (!teacherId) return;

    const payload = normalizeCreatePayload(req.body);

    if (!payload.Title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!payload.Description?.trim()) {
      return res.status(400).json({ message: "Description is required" });
    }
    if (!payload.StartTime || !payload.EndTime) {
      return res.status(400).json({ message: "StartTime and EndTime are required" });
    }
    if (!CODE_REGEX.test(payload.AccessCode)) {
      return res.status(400).json({
        message: "Access code must have exactly 6 characters (A-Z, 0-9)",
      });
    }

    const activity = await createActivity({
      ...payload,
      // IMPORTANT: proprietarul activității
      ProfessorId: teacherId, // <- dacă în DB e TeacherId, schimbă în TeacherId: teacherId
    });

    return res.status(201).json(activity);
  } catch (err) {
    console.error("POST /api/activities ERROR:", err);
    return res.status(500).json({ message: "server error" });
  }
});

/* =========================
   READ ALL (professor)
   GET /api/activities
   ========================= */
activityRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const teacherId = requireTeacherId(req, res);
    if (!teacherId) return;

    const activities = await getActivities(teacherId);
    return res.status(200).json(activities);
  } catch (err) {
    console.error("GET /api/activities ERROR:", err);
    return res.status(500).json({ message: "server error" });
  }
});

/* =========================
   READ BY CODE (student)
   GET /api/activities/code/:code
   ========================= */
activityRouter.get("/code/:code", async (req, res) => {
  try {
    const code = (req.params.code || "").toUpperCase();

    if (!CODE_REGEX.test(code)) {
      return res.status(400).json({ message: "Invalid access code format" });
    }

    const activity = await getActivityByCode(code);
    if (!activity) return res.status(404).json({ message: "Activity not found" });

    return res.status(200).json(activity);
  } catch (err) {
    console.error("GET /api/activities/code/:code ERROR:", err);
    return res.status(500).json({ message: "server error" });
  }
});

/* =========================
   READ BY ID (professor)
   GET /api/activities/:id
   ========================= */
activityRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const teacherId = requireTeacherId(req, res);
    if (!teacherId) return;

    const activity = await getActivityById(req.params.id);
    if (!activity) return res.status(404).json({ message: "not found" });

    // IMPORTANT: verifică ownership
    const ownerId = activity.ProfessorId;
    if (ownerId && teacherId && String(ownerId) !== String(teacherId)) {
      return res.status(403).json({ message: "forbidden" });
    }

    return res.status(200).json(activity);
  } catch (err) {
    console.error("GET /api/activities/:id ERROR:", err);
    return res.status(500).json({ message: "server error" });
  }
});

/* =========================
   UPDATE (professor)
   PUT /api/activities/:id
   ========================= */
activityRouter.put("/:id", authMiddleware, async (req, res) => {
  try {
    const teacherId = requireTeacherId(req, res);
    if (!teacherId) return;

    // opțional: normalizezi AccessCode dacă vine în body
    if (req.body.AccessCode || req.body.accessCode) {
      const code = (req.body.AccessCode ?? req.body.accessCode ?? "").toString().toUpperCase();
      if (!CODE_REGEX.test(code)) {
        return res.status(400).json({
          message: "Access code must have exactly 6 characters (A-Z, 0-9)",
        });
      }
      req.body.AccessCode = code;
    }

    // Recomandare: înainte de update, verifică ownership
    const current = await getActivityById(req.params.id);
    if (!current) return res.status(404).json({ message: "not found" });

    const ownerId = current.ProfessorId; // <- dacă în DB e TeacherId, schimbă în current.TeacherId
    if (ownerId && String(ownerId) !== String(teacherId)) {
      return res.status(403).json({ message: "forbidden" });
    }

    const updated = await updateActivity(req.params.id, req.body, req.teacher);
    return res.status(200).json(updated);
  } catch (err) {
    console.error("PUT /api/activities/:id ERROR:", err);
    return res.status(500).json({ message: "server error" });
  }
});

/* =========================
   DELETE (professor)
   DELETE /api/activities/:id
   ========================= */
activityRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const teacherId = requireTeacherId(req, res);
    if (!teacherId) return;

    // verifică ownership înainte de delete
    const current = await getActivityById(req.params.id);
    if (!current) return res.status(404).json({ message: "not found" });

    const ownerId = current.ProfessorId; // <- dacă în DB e TeacherId, schimbă în current.TeacherId
    if (ownerId && String(ownerId) !== String(teacherId)) {
      return res.status(403).json({ message: "forbidden" });
    }

    const ok = await deleteActivity(req.params.id, req.teacher);
    if (!ok) return res.status(404).json({ message: "not found" });

    return res.status(200).json({ message: "deleted" });
  } catch (err) {
    console.error("DELETE /api/activities/:id ERROR:", err);
    return res.status(500).json({ message: "server error" });
  }
});

export default activityRouter;
