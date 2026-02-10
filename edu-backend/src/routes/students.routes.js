import { Router } from "express";
import {
  createStudent,
  listStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} from "../controllers/students.controller.js";

const router = Router();


router.post("/", createStudent);
router.get("/", listStudents);


router.get("/:id", getStudentById);


router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

export default router;
