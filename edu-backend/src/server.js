import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();


import studentsRoutes from "./routes/students.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/students", studentsRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
