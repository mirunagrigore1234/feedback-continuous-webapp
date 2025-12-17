import authMiddleware from "../middleware/authmiddleware.js";
import express from "express";
import {
  createActivity,
  getActivities,
  getActivityById,
  getActivityByCode,
  deleteActivity,
  updateActivity
} from "../dataAccess/ActivityDA.js";

let activityRouter = express.Router();

/* CREATE (professor) */
activityRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const payload = req.body;

    // ✅ validezi ÎNAINTE să creezi
    const regex = /^[A-Z0-9]{6}$/;
    if (!regex.test(payload.AccessCode)) {
      return res.status(400).json({
        message: "Access code must have exactly 6 characters (A-Z, 0-9)"
      });
    }

    // ✅ teacherId luat din token (middleware)
    // depinde cum îl ai în JWT: id / TeacherId
    const teacherId = req.user?.id ?? req.user?.TeacherId;
    if (!teacherId) {
      return res.status(401).json({ message: "missing teacher id" });
    }

    const activity = await createActivity({
      ...payload,
      TeacherId: teacherId
    });

    res.status(201).json(activity);
  } catch (err) {
    console.warn(err.stack);
    res.status(500).json({ message: "server error" });
  }
});

/* READ ALL (professor) */
activityRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const teacherId = req.user?.id ?? req.user?.TeacherId;

    // recomandat: doar activitățile profesorului logat
    const activities = await getActivities(teacherId);

    res.status(200).json(activities);
  } catch (err) {
    console.warn(err.stack);
    res.status(500).json({ message: "server error" });
  }
});

/* READ BY CODE (student) */
activityRouter.get("/code/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();

    const regex = /^[A-Z0-9]{6}$/;
    if (!regex.test(code)) {
      return res.status(400).json({ message: "Invalid access code format" });
    }

    const activity = await getActivityByCode(code);
    if (!activity) return res.status(404).json({ message: "Activity not found" });

    res.status(200).json(activity);
  } catch (err) {
    console.warn(err.stack);
    res.status(500).json({ message: "server error" });
  }
});

/* READ BY ID */
activityRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const activity = await getActivityById(req.params.id);
    if (!activity) return res.status(404).json({ message: "not found" });

    // opțional: verifici să fie activitatea profesorului logat
    const teacherId = req.user?.id ?? req.user?.TeacherId;
    if (activity.TeacherId && teacherId && activity.TeacherId !== teacherId) {
      return res.status(403).json({ message: "forbidden" });
    }

    res.status(200).json(activity);
  } catch (err) {
    console.warn(err.stack);
    res.status(500).json({ message: "server error" });
  }
});

/* UPDATE */
activityRouter.put("/:id", authMiddleware, async (req, res) => {
  try {
    // (opțional) validezi AccessCode dacă îl modifici
    if (req.body.AccessCode) {
      const regex = /^[A-Z0-9]{6}$/;
      if (!regex.test(req.body.AccessCode)) {
        return res.status(400).json({
          message: "Access code must have exactly 6 characters (A-Z, 0-9)"
        });
      }
    }

    const activity = await updateActivity(req.params.id, req.body, req.user);
    if (!activity) return res.status(404).json({ message: "not found" });

    res.status(200).json(activity);
  } catch (err) {
    console.warn(err.stack);
    res.status(500).json({ message: "server error" });
  }
});

/* DELETE */
activityRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const ok = await deleteActivity(req.params.id, req.user);
    if (!ok) return res.status(404).json({ message: "not found" });

    res.status(200).json({ message: "deleted" });
  } catch (err) {
    console.warn(err.stack);
    res.status(500).json({ message: "server error" });
  }
});

export default activityRouter;
