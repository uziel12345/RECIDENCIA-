import { z } from "zod";

export const createStudentSchema = z.object({
  control_number: z
    .string({ required_error: "El número de control es obligatorio" })
    .min(1, "El número de control no puede estar vacío")
    .max(20),
  full_name: z
    .string({ required_error: "El nombre completo es obligatorio" })
    .min(1, "El nombre no puede estar vacío")
    .max(255),
  email: z.string().email("El correo no es válido").max(255).nullable().optional(),
  program: z
    .string({ required_error: "La carrera es obligatoria" })
    .min(1, "La carrera no puede estar vacía")
    .max(255),
  semester: z
    .number({ required_error: "El semestre es obligatorio" })
    .int("El semestre debe ser un entero")
    .min(1, "El semestre mínimo es 1")
    .max(12, "El semestre máximo es 12"),
  is_active: z.boolean().optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export const studentIdSchema = z.object({
  id: z
    .string({ required_error: "El ID es obligatorio" })
    .uuid("El ID debe ser un UUID válido"),
});

export const studentStatusSchema = z.object({
  is_active: z.boolean({ required_error: "El campo is_active es obligatorio" }),
});

export const studentControlNumberSchema = z.object({
  controlNumber: z.string().min(1).max(20),
});

export const locationQuerySchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}-[1-4]$/, "El periodo debe tener formato YYYY-N con N entre 1 y 4 (ej. 2026-1)")
    .optional(),
  at: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "El parámetro 'at' debe tener formato HH:MM")
    .refine(
      (val) => {
        const [h, m] = val.split(":").map(Number);
        return h >= 0 && h <= 23 && m >= 0 && m <= 59;
      },
      { message: "La hora debe estar entre 00:00 y 23:59" }
    )
    .optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
