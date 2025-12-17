import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getTeacherByEmail } from "../dataAccess/TeacherDA.js";

const authRouter = express.Router();

/* LOGIN profesor */
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. verificare date
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // 2. căutăm profesorul
    const teacher = await getTeacherByEmail(email);
    if (!teacher) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. verificăm parola
    const ok = await bcrypt.compare(password, teacher.PasswordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. generăm JWT
    const token = jwt.sign(
      { id: teacher.TeacherId, role: "teacher" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // 5. SCOATEM parola din răspuns 👇 AICI SE PUNE
    const { PasswordHash, ...safeTeacher } = teacher.dataValues;

    // 6. trimitem răspunsul
    res.status(200).json({
      token,
      teacher: safeTeacher
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default authRouter;