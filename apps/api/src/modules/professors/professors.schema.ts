import { z } from "zod";

export const createProfessorSchema = z.object({
  employee_number: z
    .string({ required_error: "El número de empleado es obligatorio" })
    .min(1, "El número de empleado no puede estar vacío")
    .max(20),
  rfc: z.string().min(1).max(13).nullable().optional(),
  full_name: z
    .string({ required_error: "El nombre completo es obligatorio" })
    .min(1, "El nombre no puede estar vacío")
    .max(255),
  email: z.string().email("El correo no es válido").max(255).nullable().optional(),
  department: z
    .string({ required_error: "El departamento es obligatorio" })
    .min(1, "El departamento no puede estar vacío")
    .max(255),
  is_active: z.boolean().optional(),
});

export const updateProfessorSchema = createProfessorSchema.partial();

export const professorIdSchema = z.object({
  id: z
    .string({ required_error: "El ID es obligatorio" })
    .uuid("El ID debe ser un UUID válido"),
});

export const professorStatusSchema = z.object({
  is_active: z.boolean({ required_error: "El campo is_active es obligatorio" }),
});

export const professorEmployeeNumberSchema = z.object({
  employeeNumber: z.string().min(1).max(20),
});

export const professorSearchQuerySchema = z.object({
  q: z.string().min(1).max(255),
  period: z
    .string()
    .regex(/^\d{4}-[1-4]$/, "El periodo debe tener formato YYYY-N con N entre 1 y 4 (ej. 2026-1)")
    .optional(),
  at: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "El parametro 'at' debe tener formato HH:MM")
    .refine(
      (val) => {
        const [h, m] = val.split(":").map(Number);
        return h >= 0 && h <= 23 && m >= 0 && m <= 59;
      },
      { message: "La hora debe estar entre 00:00 y 23:59" }
    )
    .optional(),
});

export type CreateProfessorInput = z.infer<typeof createProfessorSchema>;
export type UpdateProfessorInput = z.infer<typeof updateProfessorSchema>;
