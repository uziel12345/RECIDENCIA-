import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z
    .string({ required_error: "El parámetro q es obligatorio" })
    .min(2, "La búsqueda debe tener al menos 2 caracteres")
    .max(100),
  type: z
    .enum([
      "all",
      "building",
      "classroom",
      "procedure",
      "service",
      "department",
      "cubicle",
      "headquarters",
      "gate",
    ])
    .optional()
    .default("all"),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type SearchType =
  | "all"
  | "building"
  | "classroom"
  | "procedure"
  | "service"
  | "department"
  | "cubicle"
  | "headquarters"
  | "gate";
