import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const createParticipationSchema = z.object({
  student_id: z.number().int().positive(),
  course_id: z.number().int().positive(),
  event_date: dateStr,
  metric: z.string().min(1).max(50),      // e.g., "in_class", "forum_post"
  value: z.number().nonnegative().default(1),
});

export const updateParticipationSchema = z.object({
  event_date: dateStr.optional(),
  metric: z.string().min(1).max(50).optional(),
  value: z.number().nonnegative().optional(),
}).refine((obj) => Object.keys(obj).length > 0, {
  message: "Provide at least one field to update",
});

export const bulkParticipationSchema = z.object({
  records: z.array(createParticipationSchema).min(1).max(1000),
});
