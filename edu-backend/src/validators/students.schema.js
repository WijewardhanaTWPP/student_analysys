import { z } from "zod";

export const createStudentSchema = z.object({
  code: z.string().min(1).max(50),
  full_name: z.string().min(1).max(150),
});
