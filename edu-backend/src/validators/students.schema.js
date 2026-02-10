import { z } from "zod";

export const createStudentSchema = z.object({
  code: z.string().min(1).max(50),
  full_name: z.string().min(1).max(150),
});

export const updateStudentSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  full_name: z.string().min(1).max(150).optional(),
}).refine((obj) => Object.keys(obj).length > 0, {
  message: "Provide at least one field to update",
});
