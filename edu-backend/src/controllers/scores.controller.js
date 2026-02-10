import { pool } from "../db.js";
import { createScoreSchema } from "../validators/scores.schema.js";

export async function createScore(req, res) {
  const parsed = createScoreSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { student_id, course_id, assessment_name, assessment_date, score } = parsed.data;
  const max_score = parsed.data.max_score ?? 100;

  // basic sanity check
  if (score > max_score) {
    return res.status(400).json({ error: "score cannot be greater than max_score" });
  }

  try {
    // (optional but helpful) check student & course exist
    const [[student]] = await pool.execute("SELECT id FROM students WHERE id = ?", [student_id]);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const [[course]] = await pool.execute("SELECT id FROM courses WHERE id = ?", [course_id]);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Optional: ensure student is enrolled in this course
    const [[enr]] = await pool.execute(
      "SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?",
      [student_id, course_id]
    );
    if (!enr) {
      return res.status(400).json({ error: "Student is not enrolled in this course" });
    }

    const [result] = await pool.execute(
      `INSERT INTO scores
        (student_id, course_id, assessment_name, assessment_date, score, max_score)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, course_id, assessment_name, assessment_date, score, max_score]
    );

    res.status(201).json({
      id: result.insertId,
      student_id,
      course_id,
      assessment_name,
      assessment_date,
      score,
      max_score,
    });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Score for this assessment already exists (unique constraint)" });
    }
    if (e.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Invalid student_id or course_id (FK constraint)" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

export async function listScores(req, res) {
  // filters: ?student_id=1, ?course_id=2 (optional)
  const { student_id, course_id } = req.query;

  try {
    let sql = `
      SELECT
        sc.id, sc.student_id, s.code AS student_code, s.full_name,
        sc.course_id, c.code AS course_code, c.name AS course_name, c.term,
        sc.assessment_name, sc.assessment_date, sc.score, sc.max_score
      FROM scores sc
      JOIN students s ON s.id = sc.student_id
      JOIN courses  c ON c.id = sc.course_id
    `;
    const params = [];

    if (student_id && course_id) {
      sql += " WHERE sc.student_id = ? AND sc.course_id = ? ";
      params.push(Number(student_id), Number(course_id));
    } else if (student_id) {
      sql += " WHERE sc.student_id = ? ";
      params.push(Number(student_id));
    } else if (course_id) {
      sql += " WHERE sc.course_id = ? ";
      params.push(Number(course_id));
    }

    sql += " ORDER BY sc.assessment_date DESC, sc.id DESC ";

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}

export async function deleteScore(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  try {
    const [result] = await pool.execute("DELETE FROM scores WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Score not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}
