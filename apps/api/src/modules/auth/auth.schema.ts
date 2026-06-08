import { z } from "zod";

const adminUserRoleSchema = z.enum([
  "superadmin",
  "admin",
  "servicios_escolares",
  "recursos_humanos",
]);

export const loginSchema = z.object({
  usernameOrEmail: z
    .string({ required_error: "El usuario o correo es obligatorio" })
    .min(3, "El usuario o correo debe tener al menos 3 caracteres")
    .max(255),
  password: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createAdminUserSchema = z.object({
  username: z.string({ required_error: "El usuario es obligatorio" }).min(3).max(80),
  full_name: z.string({ required_error: "El nombre es obligatorio" }).min(3).max(255),
  email: z.string({ required_error: "El correo es obligatorio" }).email().max(255),
  password: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(12, "La contraseña debe tener al menos 12 caracteres")
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe incluir al menos una mayúscula, una minúscula y un dígito"
    ),
  role: adminUserRoleSchema,
  is_active: z.boolean(),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
