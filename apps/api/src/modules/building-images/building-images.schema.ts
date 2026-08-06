import { z } from "zod";

const multipartBoolean = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .transform((value) => value === true || value === "true" || value === "1");

export const buildingImageUploadSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(1_000).optional(),
    image_type: z.string().trim().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    is_cover: multipartBoolean.optional(),
    sort_order: z.coerce.number().int().min(0).max(10_000).optional(),
  })
  .strict();

export const buildingImageStatusSchema = z.object({
  is_active: z.boolean({ required_error: "El campo is_active es obligatorio" }),
});

export const buildingImagesQuerySchema = z.object({
  includeInactive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional()
    .default("false"),
});
