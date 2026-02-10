import { Router } from "express";
import {
  createAttendance,
  createAttendanceBulk,
  listAttendance,
  getStudentAttendance,
  updateAttendance,
  deleteAttendance,
} from "../controllers/attendance.controller.js";

const router = Router();


router.post("/", createAttendance);
router.post("/bulk", createAttendanceBulk);


router.get("/", listAttendance);
router.get("/student/:studentId", getStudentAttendance);

router.put("/:id", updateAttendance);


router.delete("/:id", deleteAttendance);

export default router;
