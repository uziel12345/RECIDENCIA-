import { z } from "zod";

export const catalogIdSchema = z.object({
  id: z.string().uuid("El ID debe ser un UUID válido"),
});
