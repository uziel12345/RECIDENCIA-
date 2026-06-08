import { describe, expect, it } from "vitest";
import {
  classroomIdSchema,
  classroomStatusSchema,
  createClassroomSchema,
  updateClassroomSchema,
} from "./classrooms.schema.js";

describe("createClassroomSchema", () => {
  it("accepts valid minimal input", () => {
    const result = createClassroomSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      code: "A-101",
      name: "Aula 101",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid full input", () => {
    const result = createClassroomSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      code: "LAB-1",
      name: "Laboratorio 1",
      floor: 2,
      capacity: 20,
      type: "laboratorio",
      is_active: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing building_id", () => {
    const result = createClassroomSchema.safeParse({ code: "A-101", name: "Aula" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid building_id (not UUID)", () => {
    const result = createClassroomSchema.safeParse({
      building_id: "not-a-uuid",
      code: "A-101",
      name: "Aula",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/UUID/);
    }
  });

  it("rejects missing code", () => {
    const result = createClassroomSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Aula",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = createClassroomSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      code: "A-101",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = createClassroomSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      code: "A-101",
      name: "Aula",
      type: "invalido",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid type values", () => {
    const types = ["aula", "laboratorio", "taller", "oficina", "otro"] as const;
    for (const type of types) {
      const result = createClassroomSchema.safeParse({
        building_id: "550e8400-e29b-41d4-a716-446655440000",
        code: "A-101",
        name: "Aula",
        type,
      });
      expect(result.success, `type '${type}' should be valid`).toBe(true);
    }
  });

  it("rejects capacity of 0 or negative", () => {
    const result = createClassroomSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      code: "A-101",
      name: "Aula",
      capacity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts null capacity", () => {
    const result = createClassroomSchema.safeParse({
      building_id: "550e8400-e29b-41d4-a716-446655440000",
      code: "A-101",
      name: "Aula",
      capacity: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateClassroomSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateClassroomSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update with only name", () => {
    expect(
      updateClassroomSchema.safeParse({ name: "Nuevo nombre" }).success
    ).toBe(true);
  });

  it("rejects invalid UUID in building_id when provided", () => {
    const result = updateClassroomSchema.safeParse({ building_id: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("classroomIdSchema", () => {
  it("accepts valid UUID", () => {
    expect(
      classroomIdSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" }).success
    ).toBe(true);
  });

  it("rejects non-UUID string", () => {
    const result = classroomIdSchema.safeParse({ id: "not-valid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/UUID/);
    }
  });

  it("rejects missing id", () => {
    expect(classroomIdSchema.safeParse({}).success).toBe(false);
  });
});

describe("classroomStatusSchema", () => {
  it("accepts true", () => {
    expect(classroomStatusSchema.safeParse({ is_active: true }).success).toBe(true);
  });

  it("accepts false", () => {
    expect(classroomStatusSchema.safeParse({ is_active: false }).success).toBe(true);
  });

  it("rejects missing is_active", () => {
    expect(classroomStatusSchema.safeParse({}).success).toBe(false);
  });

  it("rejects non-boolean string", () => {
    expect(classroomStatusSchema.safeParse({ is_active: "true" }).success).toBe(false);
  });
});
