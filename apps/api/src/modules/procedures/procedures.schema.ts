import { z } from "zod";

const procedureKindSchema = z.enum(["tramite", "servicio"]);

const requirementItemSchema = z.object({
  description: z
    .string({ required_error: "La descripción del requisito es obligatoria" })
    .min(1, "La descripción no puede estar vacía")
    .max(1000),
  is_mandatory: z.boolean().optional(),
  display_order: z.number().int("El orden debe ser un entero").min(0).optional(),
});

export const createProcedureSchema = z.object({
  name: z
    .string({ required_error: "El nombre es obligatorio" })
    .min(1, "El nombre no puede estar vacío")
    .max(255),
  slug: z
    .string({ required_error: "El slug es obligatorio" })
    .min(1)
    .max(255)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "El slug solo puede contener letras minúsculas, dígitos y guiones (sin guión al inicio ni al final)"
    ),
  description: z.string().max(5000).nullable().optional(),
  kind: procedureKindSchema,
  is_active: z.boolean().optional(),
  requirements: z.array(requirementItemSchema).optional(),
});

export const updateProcedureSchema = createProcedureSchema.partial();

export const procedureIdSchema = z.object({
  id: z
    .string({ required_error: "El ID del trámite es obligatorio" })
    .uuid("El ID debe ser un UUID válido"),
});

export const requirementIdSchema = z.object({
  id: z
    .string({ required_error: "El ID del requisito es obligatorio" })
    .uuid("El ID debe ser un UUID válido"),
});

export const procedureStatusSchema = z.object({
  is_active: z.boolean({ required_error: "El campo is_active es obligatorio" }),
});

export const createRequirementSchema = requirementItemSchema;

export const updateRequirementSchema = requirementItemSchema.partial().extend({
  description: z
    .string()
    .min(1, "La descripción no puede estar vacía")
    .max(1000)
    .optional(),
});

export const linkProcedureSchema = z.object({
  procedure_id: z
    .string({ required_error: "El ID del trámite es obligatorio" })
    .uuid("El ID debe ser un UUID válido"),
  notes: z.string().max(500).nullable().optional(),
});

export const buildingIdParamsSchema = z.object({
  id: z
    .string({ required_error: "El ID del edificio es obligatorio" })
    .uuid("El ID del edificio debe ser un UUID válido"),
});

export const buildingProcedureParamsSchema = z.object({
  id: z
    .string({ required_error: "El ID del edificio es obligatorio" })
    .uuid("El ID del edificio debe ser un UUID válido"),
  procedureId: z
    .string({ required_error: "El ID del trámite es obligatorio" })
    .uuid("El ID del trámite debe ser un UUID válido"),
});

export const proceduresQuerySchema = z.object({
  kind: procedureKindSchema.optional(),
  buildingId: z.string().uuid("El buildingId debe ser un UUID válido").optional(),
});

export type CreateProcedureInput = z.infer<typeof createProcedureSchema>;
export type UpdateProcedureInput = z.infer<typeof updateProcedureSchema>;
export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;
export type UpdateRequirementInput = z.infer<typeof updateRequirementSchema>;
export type LinkProcedureInput = z.infer<typeof linkProcedureSchema>;
export type ProceduresQueryInput = z.infer<typeof proceduresQuerySchema>;
