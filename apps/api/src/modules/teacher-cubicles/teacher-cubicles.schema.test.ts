import { describe, expect, it } from "vitest";
import {
  createTeacherCubicleSchema,
  teacherCubicleIdSchema,
  teacherCubicleStatusSchema,
  updateTeacherCubicleSchema,
} from "./teacher-cubicles.schema.js";

describe("createTeacherCubicleSchema", () => {
  it("accepts valid minimal input", () => {
    const result = createTeacherCubicleSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      code: "CUB-101",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid full input", () => {
    const result = createTeacherCubicleSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      code: "CUB-101",
      professor_id: "550e8400-e29b-41d4-a716-446655440001",
      department_id: "550e8400-e29b-41d4-a716-446655440002",
      schedule_text: "Lunes a viernes 8:00-15:00",
      notes: "Cubículo compartido",
      is_active: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing building_id", () => {
    const result = createTeacherCubicleSchema.safeParse({ code: "CUB-101" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid building_id (not UUID)", () => {
    const result = createTeacherCubicleSchema.safeParse({
      building_id: "not-a-uuid",
      code: "CUB-101",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/UUID/);
    }
  });

  it("rejects missing code", () => {
    const result = createTeacherCubicleSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty code", () => {
    const result = createTeacherCubicleSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      code: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid professor_id (not UUID)", () => {
    const result = createTeacherCubicleSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      code: "CUB-101",
      professor_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid department_id (not UUID)", () => {
    const result = createTeacherCubicleSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      code: "CUB-101",
      department_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null optional fields", () => {
    const result = createTeacherCubicleSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      code: "CUB-101",
      professor_id: null,
      department_id: null,
      schedule_text: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateTeacherCubicleSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateTeacherCubicleSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update with only code", () => {
    expect(
      updateTeacherCubicleSchema.safeParse({ code: "CUB-202" }).success
    ).toBe(true);
  });

  it("rejects invalid UUID in building_id when provided", () => {
    const result = updateTeacherCubicleSchema.safeParse({ building_id: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("teacherCubicleIdSchema", () => {
  it("accepts valid UUID", () => {
    expect(
      teacherCubicleIdSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" })
        .success
    ).toBe(true);
  });

  it("rejects non-UUID string", () => {
    const result = teacherCubicleIdSchema.safeParse({ id: "not-valid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing id", () => {
    expect(teacherCubicleIdSchema.safeParse({}).success).toBe(false);
  });
});

describe("teacherCubicleStatusSchema", () => {
  it("accepts true", () => {
    expect(teacherCubicleStatusSchema.safeParse({ is_active: true }).success).toBe(true);
  });

  it("accepts false", () => {
    expect(teacherCubicleStatusSchema.safeParse({ is_active: false }).success).toBe(true);
  });

  it("rejects missing is_active", () => {
    expect(teacherCubicleStatusSchema.safeParse({}).success).toBe(false);
  });

  it("rejects non-boolean string", () => {
    expect(teacherCubicleStatusSchema.safeParse({ is_active: "true" }).success).toBe(
      false
    );
  });
});
