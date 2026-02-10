import { Router } from "express";
import { createEnrollment, listEnrollments } from "../controllers/enrollments.controller.js";

const router = Router();

router.post("/", createEnrollment);

router.get("/", listEnrollments);

export default router;
