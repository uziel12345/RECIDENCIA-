import { z } from "zod";

const userRoleSchema = z.enum([
  "superadmin",
  "admin",
  "servicios_escolares",
  "recursos_humanos",
  "viewer",
]);

export const adminUserIdSchema = z.object({
  id: z.string({ required_error: "El ID del usuario es obligatorio" }).uuid(),
});

export const createAdminUserSchema = z.object({
  username: z.string({ required_error: "El usuario es obligatorio" }).min(1).max(100),
  full_name: z.string({ required_error: "El nombre completo es obligatorio" }).min(1).max(255),
  email: z.string({ required_error: "El correo es obligatorio" }).email().max(255),
  password: z.string({ required_error: "La contrasena es obligatoria" }).min(8).max(255),
  role: userRoleSchema,
  is_active: z.boolean({ required_error: "El estado es obligatorio" }),
});

export const updateAdminUserSchema = createAdminUserSchema
  .extend({
    password: z.string().min(8).max(255).optional(),
  })
  .partial();

export const updateAdminUserStatusSchema = z.object({
  is_active: z.boolean({ required_error: "El estado es obligatorio" }),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
