import { z } from "zod";

export const createCourseSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(150),
  term: z.string().min(1).max(50),
});

export const updateCourseSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(150).optional(),
  term: z.string().min(1).max(50).optional(),
}).refine((obj) => Object.keys(obj).length > 0, {
  message: "Provide at least one field to update",
});
