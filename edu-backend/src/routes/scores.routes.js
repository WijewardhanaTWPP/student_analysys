import { Router } from "express";
import { createScore, listScores, deleteScore } from "../controllers/scores.controller.js";

const router = Router();


router.post("/", createScore);


router.get("/", listScores);


router.delete("/:id", deleteScore);

export default router;
