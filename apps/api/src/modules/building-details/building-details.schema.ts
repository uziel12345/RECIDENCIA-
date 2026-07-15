import { z } from "zod";

export const buildingIdParamsSchema = z.object({
  id: z
    .string({ required_error: "El ID del edificio es obligatorio" })
    .uuid("El ID del edificio debe ser un UUID válido"),
});
