import { pool } from "../db.js";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
  bulkAttendanceSchema,
} from "../validators/attendance.schema.js";

// check student and course exist+student enrolled
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

// POST /api/attendance
export async function createAttendance(req, res) {
  const parsed = createAttendanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { student_id, course_id, attend_date, status } = parsed.data;

  try {
    const check = await ensureStudentCourseAndEnrollment(student_id, course_id);
    if (!check.ok) return res.status(check.code).json({ error: check.msg });

    const [result] = await pool.execute(
      "INSERT INTO attendance (student_id, course_id, attend_date, status) VALUES (?, ?, ?, ?)",
      [student_id, course_id, attend_date, status]
    );

    res.status(201).json({ id: result.insertId, student_id, course_id, attend_date, status });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Attendance already marked for this date (unique constraint)" });
    }
    if (e.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Invalid student_id or course_id (FK constraint)" });
    }
    res.status(500).json({ error: "Server error" });
  }
}

// /api/attendance/bulk
export async function createAttendanceBulk(req, res) {
  const parsed = bulkAttendanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { records } = parsed.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    
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

    // Insert each record
    let inserted = 0;
    for (const r of records) {
      try {
        await conn.execute(
          "INSERT INTO attendance (student_id, course_id, attend_date, status) VALUES (?, ?, ?, ?)",
          [r.student_id, r.course_id, r.attend_date, r.status]
        );
        inserted += 1;
      } catch (e) {
        
        if (e.code !== "ER_DUP_ENTRY") throw e;
      }
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


export async function listAttendance(req, res) {
  const { student_id, course_id, from, to, status } = req.query;

  try {
    let sql = `
      SELECT
        a.id, a.student_id, s.code AS student_code, s.full_name,
        a.course_id, c.code AS course_code, c.name AS course_name, c.term,
        a.attend_date, a.status
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      JOIN courses  c ON c.id = a.course_id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) {
      sql += " AND a.student_id = ? ";
      params.push(Number(student_id));
    }
    if (course_id) {
      sql += " AND a.course_id = ? ";
      params.push(Number(course_id));
    }
    if (status) {
      sql += " AND a.status = ? ";
      params.push(status);
    }
    if (from) {
      sql += " AND a.attend_date >= ? ";
      params.push(from);
    }
    if (to) {
      sql += " AND a.attend_date <= ? ";
      params.push(to);
    }

    sql += " ORDER BY a.attend_date DESC, a.id DESC ";

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}


export async function getStudentAttendance(req, res) {
  const studentId = Number(req.params.studentId);
  if (!Number.isInteger(studentId) || studentId <= 0) {
    return res.status(400).json({ error: "Invalid studentId" });
  }

  const { course_id, from, to } = req.query;

  try {
    let sql = `
      SELECT a.id, a.course_id, c.code AS course_code, c.name AS course_name, c.term,
             a.attend_date, a.status
      FROM attendance a
      JOIN courses c ON c.id = a.course_id
      WHERE a.student_id = ?
    `;
    const params = [studentId];

    if (course_id) {
      sql += " AND a.course_id = ? ";
      params.push(Number(course_id));
    }
    if (from) {
      sql += " AND a.attend_date >= ? ";
      params.push(from);
    }
    if (to) {
      sql += " AND a.attend_date <= ? ";
      params.push(to);
    }

    sql += " ORDER BY a.attend_date DESC ";

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}


export async function updateAttendance(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateAttendanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { status } = parsed.data;

  try {
    const [result] = await pool.execute(
      "UPDATE attendance SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Attendance record not found" });
    res.json({ ok: true, id, status });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}

// DELETE /api/attendance/:id
export async function deleteAttendance(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  try {
    const [result] = await pool.execute("DELETE FROM attendance WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Attendance record not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}
