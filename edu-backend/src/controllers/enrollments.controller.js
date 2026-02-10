import { pool } from "../db.js";
import { createEnrollmentSchema } from "../validators/enrollments.schema.js";

export async function createEnrollment(req, res) {
  const parsed = createEnrollmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { student_id, course_id } = parsed.data;

  try {
    // Optional but beginner-friendly: check student & course exist
    const [[student]] = await pool.execute(
      "SELECT id FROM students WHERE id = ?",
      [student_id]
    );
    if (!student) return res.status(404).json({ error: "Student not found" });

    const [[course]] = await pool.execute(
      "SELECT id FROM courses WHERE id = ?",
      [course_id]
    );
    if (!course) return res.status(404).json({ error: "Course not found" });

    const [result] = await pool.execute(
      "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
      [student_id, course_id]
    );

    res.status(201).json({ id: result.insertId, student_id, course_id });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "This student is already enrolled in this course" });
    }
    // FK errors (if you remove the checks above)
    if (e.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Invalid student_id or course_id (FK constraint)" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

export async function listEnrollments(req, res) {
  // Optional filters: ?student_id=1 or ?course_id=2
  const { student_id, course_id } = req.query;

  try {
    let sql = `
      SELECT e.id, e.student_id, s.code AS student_code, s.full_name,
             e.course_id, c.code AS course_code, c.name AS course_name, c.term
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN courses c ON c.id = e.course_id
    `;
    const params = [];

    if (student_id) {
      sql += " WHERE e.student_id = ? ";
      params.push(Number(student_id));
    } else if (course_id) {
      sql += " WHERE e.course_id = ? ";
      params.push(Number(course_id));
    }

    sql += " ORDER BY e.id DESC ";

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}
