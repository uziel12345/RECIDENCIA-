import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z
    .string({ required_error: "El parámetro q es obligatorio" })
    .trim()
    .min(1, "Escribe algo para buscar")
    .max(120, "La búsqueda no puede superar 120 caracteres"),
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
      "position",
      "street",
      "person",
      "office",
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
  | "gate"
  | "position"
  | "street"
  | "person"
  | "office";
