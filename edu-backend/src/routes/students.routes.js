import { Router } from "express";
import { createStudent, listStudents } from "../controllers/students.controller.js";

const router = Router();
router.post("/", createStudent);
router.get("/", listStudents);

export default router;
