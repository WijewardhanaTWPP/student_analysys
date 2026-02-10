import { z } from "zod";

export const createScoreSchema = z.object({
  student_id: z.number().int().positive(),
  course_id: z.number().int().positive(),
  assessment_name: z.string().min(1).max(150),
  assessment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  score: z.number().nonnegative(),
  max_score: z.number().positive().optional(), 
});
