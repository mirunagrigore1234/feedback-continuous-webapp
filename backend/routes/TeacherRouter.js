//Definirea rutelor /api/auth/login și /api/auth/register
import authMiddleware from "../middleware/authmiddleware.js";
import express from "express";
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  getTeacherByEmail
}  from "../dataAccess/TeacherDA.js";

let teacherRouter = express.Router();

/* CREATE */
teacherRouter.route("/").post(async (req, res) => {
  try {
    const teacher = await createTeacher(req.body);
    res.status(201).json(teacher);
  } catch (err) {
    console.warn(err.stack);
    res.status(500).json({ message: "server error" });
  }
});

/* READ ALL */
teacherRouter.route("/")
  .get(authMiddleware, async (req, res) => {
    const teachers = await getTeachers();
    res.json(teachers);
  });

/* READ BY ID */
teacherRouter.route("/:id").get(authMiddleware, async (req, res) =>  {
  try {
    const teacher = await getTeacherById(req.params.id);
    if (!teacher)
      return res.status(404).json({ message: "not found" });

    const { PasswordHash, ...safeTeacher } = teacher.dataValues;  

    res.status(200).json(safeTeacher);
  } catch (err) {
    console.warn(err.stack);
    res.status(500).json({ message: "server error" });
  }
});

teacherRouter.route("/email/:email").get(authMiddleware, async (req, res) => {
  try {
    const teacher = await getTeacherByEmail(req.params.email);

    if (!teacher)
      return res.status(404).json({ message: "not found" });

    const { PasswordHash, ...safeTeacher } = teacher.dataValues;

    res.status(200).json(safeTeacher);
  } catch (err) {
    console.warn(err.stack);
    res.status(500).json({ message: "server error" });
  }
});

export default teacherRouter;
