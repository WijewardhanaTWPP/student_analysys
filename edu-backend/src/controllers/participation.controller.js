import { pool } from "../db.js";
import {
  createParticipationSchema,
  updateParticipationSchema,
  bulkParticipationSchema,
} from "../validators/participation.schema.js";

async function ensureStudentCourseAndEnrollment(student_id, course_id) {
  const [[student]] = await pool.execute("SELECT id FROM students WHERE id = ?", [student_id]);
  if (!student) return { ok: false, code: 404, msg: "Student not found" };

  const [[course]] = await pool.execute("SELECT id FROM courses WHERE id = ?", [course_id]);
  if (!course) return { ok: false, code: 404, msg: "Course not found" };

  const [[enr]] = await pool.execute(
    "SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?",
    [student_id, course_id]
  );
  if (!enr) return { ok: false, code: 400, msg: "Student is not enrolled in this course" };

  return { ok: true };
}

// POST /api/participation
export async function createParticipation(req, res) {
  const parsed = createParticipationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { student_id, course_id, event_date, metric } = parsed.data;
  const value = parsed.data.value ?? 1;

  try {
    const check = await ensureStudentCourseAndEnrollment(student_id, course_id);
    if (!check.ok) return res.status(check.code).json({ error: check.msg });

    const [result] = await pool.execute(
      `INSERT INTO participation (student_id, course_id, event_date, metric, value)
       VALUES (?, ?, ?, ?, ?)`,
      [student_id, course_id, event_date, metric, value]
    );

    res.status(201).json({
      id: result.insertId,
      student_id,
      course_id,
      event_date,
      metric,
      value,
    });
  } catch (e) {
    if (e.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Invalid student_id or course_id (FK constraint)" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/participation/bulk
export async function createParticipationBulk(req, res) {
  const parsed = bulkParticipationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { records } = parsed.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Ensure enrollments exist (safe for correctness)
    for (const r of records) {
      const [[enr]] = await conn.execute(
        "SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?",
        [r.student_id, r.course_id]
      );
      if (!enr) {
        await conn.rollback();
        return res.status(400).json({
          error: `Student ${r.student_id} is not enrolled in course ${r.course_id}`,
        });
      }
    }

    // Insert
    let inserted = 0;
    for (const r of records) {
      await conn.execute(
        `INSERT INTO participation (student_id, course_id, event_date, metric, value)
         VALUES (?, ?, ?, ?, ?)`,
        [r.student_id, r.course_id, r.event_date, r.metric, r.value ?? 1]
      );
      inserted += 1;
    }

    await conn.commit();
    res.status(201).json({ inserted, total: records.length });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: "Server error" });
  } finally {
    conn.release();
  }
}

// GET /api/participation?student_id=&course_id=&from=&to=&metric=
export async function listParticipation(req, res) {
  const { student_id, course_id, from, to, metric } = req.query;

  try {
    let sql = `
      SELECT
        p.id, p.student_id, s.code AS student_code, s.full_name,
        p.course_id, c.code AS course_code, c.name AS course_name, c.term,
        p.event_date, p.metric, p.value
      FROM participation p
      JOIN students s ON s.id = p.student_id
      JOIN courses  c ON c.id = p.course_id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) {
      sql += " AND p.student_id = ? ";
      params.push(Number(student_id));
    }
    if (course_id) {
      sql += " AND p.course_id = ? ";
      params.push(Number(course_id));
    }
    if (metric) {
      sql += " AND p.metric = ? ";
      params.push(metric);
    }
    if (from) {
      sql += " AND p.event_date >= ? ";
      params.push(from);
    }
    if (to) {
      sql += " AND p.event_date <= ? ";
      params.push(to);
    }

    sql += " ORDER BY p.event_date DESC, p.id DESC ";

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}

// GET /api/participation/student/:studentId?course_id=&from=&to=
export async function getStudentParticipation(req, res) {
  const studentId = Number(req.params.studentId);
  if (!Number.isInteger(studentId) || studentId <= 0) {
    return res.status(400).json({ error: "Invalid studentId" });
  }

  const { course_id, from, to } = req.query;

  try {
    let sql = `
      SELECT
        p.id, p.course_id, c.code AS course_code, c.name AS course_name, c.term,
        p.event_date, p.metric, p.value
      FROM participation p
      JOIN courses c ON c.id = p.course_id
      WHERE p.student_id = ?
    `;
    const params = [studentId];

    if (course_id) {
      sql += " AND p.course_id = ? ";
      params.push(Number(course_id));
    }
    if (from) {
      sql += " AND p.event_date >= ? ";
      params.push(from);
    }
    if (to) {
      sql += " AND p.event_date <= ? ";
      params.push(to);
    }

    sql += " ORDER BY p.event_date DESC, p.id DESC ";

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}

// PUT /api/participation/:id
export async function updateParticipation(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateParticipationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const fields = [];
  const params = [];

  if (parsed.data.event_date) {
    fields.push("event_date = ?");
    params.push(parsed.data.event_date);
  }
  if (parsed.data.metric) {
    fields.push("metric = ?");
    params.push(parsed.data.metric);
  }
  if (parsed.data.value !== undefined) {
    fields.push("value = ?");
    params.push(parsed.data.value);
  }

  params.push(id);

  try {
    const [result] = await pool.execute(
      `UPDATE participation SET ${fields.join(", ")} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Participation record not found" });
    res.json({ ok: true, id, updated: parsed.data });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}

// DELETE /api/participation/:id
export async function deleteParticipation(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  try {
    const [result] = await pool.execute("DELETE FROM participation WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Participation record not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}
