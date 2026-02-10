import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();


import studentsRoutes from "./routes/students.routes.js";
import coursesRoutes from "./routes/courses.routes.js";
import enrollmentsRoutes from "./routes/enrollments.routes.js";
import scoresRoutes from "./routes/scores.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import participationRoutes from "./routes/participation.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/students", studentsRoutes);

app.use("/api/courses", coursesRoutes);
app.use("/api/enrollments", enrollmentsRoutes);

app.use("/api/scores", scoresRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use("/api/participation", participationRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
