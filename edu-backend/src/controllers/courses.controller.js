import { pool } from "../db.js";
import { createCourseSchema, updateCourseSchema } from "../validators/courses.schema.js";

export async function createCourse(req, res) {
  const parsed = createCourseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { code, name, term } = parsed.data;

  try {
    const [result] = await pool.execute(
      "INSERT INTO courses (code, name, term) VALUES (?, ?, ?)",
      [code, name, term]
    );
    res.status(201).json({ id: result.insertId, code, name, term });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Course code + term already exists" });
    res.status(500).json({ error: "Server error" });
  }
}

export async function listCourses(req, res) {
  const { term } = req.query;

  try {
    if (term) {
      const [rows] = await pool.execute(
        "SELECT id, code, name, term FROM courses WHERE term = ? ORDER BY id DESC",
        [term]
      );
      return res.json(rows);
    }

    const [rows] = await pool.query("SELECT id, code, name, term FROM courses ORDER BY id DESC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}

// ✅ NEW: GET /api/courses/:id
export async function getCourseById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  try {
    const [[row]] = await pool.execute(
      "SELECT id, code, name, term FROM courses WHERE id = ?",
      [id]
    );
    if (!row) return res.status(404).json({ error: "Course not found" });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}

// ✅ NEW: GET /api/courses/code/:code/term/:term
export async function getCourseByCodeAndTerm(req, res) {
  const code = String(req.params.code || "").trim();
  const term = String(req.params.term || "").trim();

  if (!code) return res.status(400).json({ error: "Invalid code" });
  if (!term) return res.status(400).json({ error: "Invalid term" });

  try {
    const [[row]] = await pool.execute(
      "SELECT id, code, name, term FROM courses WHERE code = ? AND term = ?",
      [code, term]
    );
    if (!row) return res.status(404).json({ error: "Course not found" });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}

// (optional) PUT /api/courses/:id
export async function updateCourse(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateCourseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const fields = [];
  const params = [];

  if (parsed.data.code) {
    fields.push("code = ?");
    params.push(parsed.data.code);
  }
  if (parsed.data.name) {
    fields.push("name = ?");
    params.push(parsed.data.name);
  }
  if (parsed.data.term) {
    fields.push("term = ?");
    params.push(parsed.data.term);
  }

  params.push(id);

  try {
    const [result] = await pool.execute(
      `UPDATE courses SET ${fields.join(", ")} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Course not found" });

    const [[updated]] = await pool.execute(
      "SELECT id, code, name, term FROM courses WHERE id = ?",
      [id]
    );
    res.json(updated);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Course code + term already exists" });
    res.status(500).json({ error: "Server error" });
  }
}

// (optional) DELETE /api/courses/:id
export async function deleteCourse(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  try {
    const [result] = await pool.execute("DELETE FROM courses WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Course not found" });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({ error: "Cannot delete course: referenced by other records" });
    }
    res.status(500).json({ error: "Server error" });
  }
}
