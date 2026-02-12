import { z } from "zod";

export const predictSchema = z.object({
  student_id: z.number().int().positive(),
  course_id: z.number().int().positive(),
});
