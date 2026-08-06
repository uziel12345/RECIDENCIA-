import { describe, expect, it } from "vitest";
import {
  buildingImageStatusSchema,
  buildingImagesQuerySchema,
  buildingImageUploadSchema,
} from "./building-images.schema.js";

describe("building image schemas", () => {
  it("normalizes bounded multipart fields", () => {
    const result = buildingImageUploadSchema.parse({
      title: " Entrada ", is_cover: "false", sort_order: "2", image_type: "fachada_1",
    });
    expect(result).toEqual({
      title: "Entrada", is_cover: false, sort_order: 2, image_type: "fachada_1",
    });
  });

  it("rejects unknown, oversized and invalid fields", () => {
    expect(buildingImageUploadSchema.safeParse({ unexpected: "x" }).success).toBe(false);
    expect(buildingImageUploadSchema.safeParse({ title: "x".repeat(256) }).success).toBe(false);
    expect(buildingImageUploadSchema.safeParse({ is_cover: "yes" }).success).toBe(false);
    expect(buildingImageStatusSchema.safeParse({ is_active: "true" }).success).toBe(false);
  });

  it("normalizes the includeInactive query", () => {
    expect(buildingImagesQuerySchema.parse({})).toEqual({ includeInactive: false });
    expect(buildingImagesQuerySchema.parse({ includeInactive: "true" })).toEqual({ includeInactive: true });
  });
});
