import { z } from "zod";

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
