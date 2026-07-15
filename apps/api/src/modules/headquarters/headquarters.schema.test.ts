import { describe, expect, it } from "vitest";
import {
  createHeadquartersSchema,
  headquartersIdSchema,
  headquartersStatusSchema,
  updateHeadquartersSchema,
} from "./headquarters.schema.js";

describe("createHeadquartersSchema", () => {
  it("accepts valid minimal input", () => {
    const result = createHeadquartersSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Jefatura de Servicios Escolares",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid full input", () => {
    const result = createHeadquartersSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Jefatura de Servicios Escolares",
      head_name: "Ing. Juan Pérez",
      department_id: "550e8400-e29b-41d4-a716-446655440001",
      schedule_text: "Lunes a viernes 8:00-15:00",
      contact: "servicios@itoaxaca.edu.mx",
      is_active: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing building_id", () => {
    const result = createHeadquartersSchema.safeParse({ name: "Jefatura" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid building_id (not UUID)", () => {
    const result = createHeadquartersSchema.safeParse({
      building_id: "not-a-uuid",
      name: "Jefatura",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/UUID/);
    }
  });

  it("rejects missing name", () => {
    const result = createHeadquartersSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid department_id (not UUID)", () => {
    const result = createHeadquartersSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Jefatura",
      department_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null optional fields", () => {
    const result = createHeadquartersSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Jefatura",
      head_name: null,
      department_id: null,
      schedule_text: null,
      contact: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateHeadquartersSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateHeadquartersSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update with only name", () => {
    expect(
      updateHeadquartersSchema.safeParse({ name: "Nuevo nombre" }).success
    ).toBe(true);
  });

  it("rejects invalid UUID in building_id when provided", () => {
    const result = updateHeadquartersSchema.safeParse({ building_id: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID in department_id when provided", () => {
    const result = updateHeadquartersSchema.safeParse({ department_id: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("headquartersIdSchema", () => {
  it("accepts valid UUID", () => {
    expect(
      headquartersIdSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" }).success
    ).toBe(true);
  });

  it("rejects non-UUID string", () => {
    const result = headquartersIdSchema.safeParse({ id: "not-valid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing id", () => {
    expect(headquartersIdSchema.safeParse({}).success).toBe(false);
  });
});

describe("headquartersStatusSchema", () => {
  it("accepts true", () => {
    expect(headquartersStatusSchema.safeParse({ is_active: true }).success).toBe(true);
  });

  it("accepts false", () => {
    expect(headquartersStatusSchema.safeParse({ is_active: false }).success).toBe(true);
  });

  it("rejects missing is_active", () => {
    expect(headquartersStatusSchema.safeParse({}).success).toBe(false);
  });

  it("rejects non-boolean string", () => {
    expect(headquartersStatusSchema.safeParse({ is_active: "true" }).success).toBe(false);
  });
});
