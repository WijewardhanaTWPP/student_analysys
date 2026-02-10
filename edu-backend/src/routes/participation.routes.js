import { Router } from "express";
import {
  createParticipation,
  createParticipationBulk,
  listParticipation,
  getStudentParticipation,
  updateParticipation,
  deleteParticipation,
} from "../controllers/participation.controller.js";

const router = Router();


router.post("/", createParticipation);
router.post("/bulk", createParticipationBulk);


router.get("/", listParticipation);
router.get("/student/:studentId", getStudentParticipation);


router.put("/:id", updateParticipation);


router.delete("/:id", deleteParticipation);

export default router;
