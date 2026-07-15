import { describe, expect, it } from "vitest";
import {
  createDepartmentSchema,
  departmentIdSchema,
  departmentStatusSchema,
  updateDepartmentSchema,
} from "./departments.schema.js";

describe("createDepartmentSchema", () => {
  it("accepts valid minimal input", () => {
    const result = createDepartmentSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Departamento de Sistemas",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid full input", () => {
    const result = createDepartmentSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Departamento de Sistemas",
      description: "Coordina la carrera de Ing. en Sistemas",
      schedule_text: "Lunes a viernes 8:00-15:00",
      head_name: "Ing. Juan Pérez",
      contact: "sistemas@itoaxaca.edu.mx",
      is_active: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing building_id", () => {
    const result = createDepartmentSchema.safeParse({ name: "Departamento" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid building_id (not UUID)", () => {
    const result = createDepartmentSchema.safeParse({
      building_id: "not-a-uuid",
      name: "Departamento",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/UUID/);
    }
  });

  it("rejects missing name", () => {
    const result = createDepartmentSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null optional fields", () => {
    const result = createDepartmentSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Departamento",
      description: null,
      schedule_text: null,
      head_name: null,
      contact: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateDepartmentSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateDepartmentSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update with only name", () => {
    expect(
      updateDepartmentSchema.safeParse({ name: "Nuevo nombre" }).success
    ).toBe(true);
  });

  it("rejects invalid UUID in building_id when provided", () => {
    const result = updateDepartmentSchema.safeParse({ building_id: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("departmentIdSchema", () => {
  it("accepts valid UUID", () => {
    expect(
      departmentIdSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" }).success
    ).toBe(true);
  });

  it("rejects non-UUID string", () => {
    const result = departmentIdSchema.safeParse({ id: "not-valid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing id", () => {
    expect(departmentIdSchema.safeParse({}).success).toBe(false);
  });
});

describe("departmentStatusSchema", () => {
  it("accepts true", () => {
    expect(departmentStatusSchema.safeParse({ is_active: true }).success).toBe(true);
  });

  it("accepts false", () => {
    expect(departmentStatusSchema.safeParse({ is_active: false }).success).toBe(true);
  });

  it("rejects missing is_active", () => {
    expect(departmentStatusSchema.safeParse({}).success).toBe(false);
  });

  it("rejects non-boolean string", () => {
    expect(departmentStatusSchema.safeParse({ is_active: "true" }).success).toBe(false);
  });
});
