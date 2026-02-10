import { Router } from "express";
import {
  createCourse,
  listCourses,
  getCourseById,
  getCourseByCodeAndTerm,
  updateCourse,
  deleteCourse,
} from "../controllers/courses.controller.js";

const router = Router();


router.post("/", createCourse);
router.get("/", listCourses);


router.get("/code/:code/term/:term", getCourseByCodeAndTerm);


router.get("/:id", getCourseById);


router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

export default router;
