import { z } from "zod";

export const createProfessorSchema = z.object({
  employee_number: z
    .string({ required_error: "El número de empleado es obligatorio" })
    .min(1, "El número de empleado no puede estar vacío")
    .max(20),
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

export type CreateProfessorInput = z.infer<typeof createProfessorSchema>;
export type UpdateProfessorInput = z.infer<typeof updateProfessorSchema>;
