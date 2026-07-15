import { z } from "zod";

const timeSchema = z
  .string({ required_error: "La hora es obligatoria" })
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "La hora debe tener formato HH:MM o HH:MM:SS");

export const createBuildingScheduleSchema = z.object({
  building_id: z
    .string({ required_error: "El edificio es obligatorio" })
    .uuid("El building_id debe ser un UUID válido"),
  day_of_week: z
    .number({ required_error: "El día de la semana es obligatorio" })
    .int("El día debe ser un entero")
    .min(1, "El día debe estar entre 1 (Lunes) y 7 (Domingo)")
    .max(7, "El día debe estar entre 1 (Lunes) y 7 (Domingo)"),
  open_time: timeSchema,
  close_time: timeSchema,
  is_active: z.boolean().optional(),
});

export const updateBuildingScheduleSchema = createBuildingScheduleSchema.partial();

export const buildingScheduleIdSchema = z.object({
  id: z
    .string({ required_error: "El ID del horario es obligatorio" })
    .uuid("El ID debe ser un UUID válido"),
});

export const buildingScheduleStatusSchema = z.object({
  is_active: z.boolean({ required_error: "El campo is_active es obligatorio" }),
});

export type CreateBuildingScheduleInput = z.infer<typeof createBuildingScheduleSchema>;
export type UpdateBuildingScheduleInput = z.infer<typeof updateBuildingScheduleSchema>;
