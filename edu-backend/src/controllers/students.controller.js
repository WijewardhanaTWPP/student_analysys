import { pool } from "../db.js";
import { createStudentSchema, updateStudentSchema } from "../validators/students.schema.js";

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
  const [rows] = await pool.query(
    "SELECT id, code, full_name FROM students ORDER BY id DESC"
  );
  res.json(rows);
}

// ✅ NEW: GET /api/students/:id
export async function getStudentById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  try {
    const [[row]] = await pool.execute(
      "SELECT id, code, full_name FROM students WHERE id = ?",
      [id]
    );
    if (!row) return res.status(404).json({ error: "Student not found" });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}

// (optional) PUT /api/students/:id
export async function updateStudent(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateStudentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const fields = [];
  const params = [];

  if (parsed.data.code) {
    fields.push("code = ?");
    params.push(parsed.data.code);
  }
  if (parsed.data.full_name) {
    fields.push("full_name = ?");
    params.push(parsed.data.full_name);
  }

  params.push(id);

  try {
    const [result] = await pool.execute(
      `UPDATE students SET ${fields.join(", ")} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Student not found" });

    const [[updated]] = await pool.execute(
      "SELECT id, code, full_name FROM students WHERE id = ?",
      [id]
    );
    res.json(updated);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Student code already exists" });
    res.status(500).json({ error: "Server error" });
  }
}

// (optional) DELETE /api/students/:id
export async function deleteStudent(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  try {
    const [result] = await pool.execute("DELETE FROM students WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Student not found" });
    res.json({ ok: true });
  } catch (e) {
    // If you delete a student that has enrollments/scores/attendance etc, FK may block it.
    if (e.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({ error: "Cannot delete student: referenced by other records" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

