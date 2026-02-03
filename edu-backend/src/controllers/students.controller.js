import { pool } from "../db.js";
import { createStudentSchema } from "../validators/students.schema.js";

export async function createStudent(req, res) {
  const parsed = createStudentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { code, full_name } = parsed.data;
  try {
    const [result] = await pool.execute(
      "INSERT INTO students (code, full_name) VALUES (?, ?)",
      [code, full_name]
    );
    res.status(201).json({ id: result.insertId, code, full_name });
  } catch (e) {
    
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Student code already exists" });
    res.status(500).json({ error: "Server error" });
  }
}

export async function listStudents(req, res) {
  const [rows] = await pool.query("SELECT id, code, full_name FROM students ORDER BY id DESC");
  res.json(rows);
}
