import express from "express";
import dotenv from "dotenv";

import DB_Init from "./entities/DB_Init.js";

import authRouter from "./routes/authRouter.js";
import teacherRouter from "./routes/TeacherRouter.js";
import activityRouter from "./routes/ActivityRouter.js";
import feedbackRouter from "./routes/FeedbackRouter.js";
import createDbRouter from "./routes/CreateDbRouter.js";

dotenv.config();

const app = express();
app.use(express.json());

/* ROUTES */
app.use("/api/auth", authRouter);
app.use("/api/db", createDbRouter);
app.use("/api/teachers", teacherRouter);
app.use("/api/activities", activityRouter);
app.use("/api/feedback", feedbackRouter);

app.get("/", (req, res) => res.json({ message: "Backend works!" }));

/* INIT DATABASE */
DB_Init().catch((err) => console.error("Failed to initialize database", err));

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
