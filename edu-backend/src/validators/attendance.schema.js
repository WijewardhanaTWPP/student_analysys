import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const attendanceStatusEnum = z.enum(["present", "absent", "late", "excused"]);

export const createAttendanceSchema = z.object({
  student_id: z.number().int().positive(),
  course_id: z.number().int().positive(),
  attend_date: dateStr,
  status: attendanceStatusEnum,
});

export const updateAttendanceSchema = z.object({
  status: attendanceStatusEnum,
});

export const bulkAttendanceSchema = z.object({
  records: z.array(createAttendanceSchema).min(1).max(500),
});
