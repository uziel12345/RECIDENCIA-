import { describe, it, expect } from "vitest";
import {
  createStudentSchema,
  updateStudentSchema,
  studentIdSchema,
  studentStatusSchema,
  locationQuerySchema,
} from "./students.schema.js";

const validCreate = {
  control_number: "20221001",
  full_name: "Ana García",
  program: "Ingeniería en Sistemas",
  semester: 4,
};

describe("createStudentSchema", () => {
  it("accepts valid input", () => {
    expect(createStudentSchema.safeParse(validCreate).success).toBe(true);
  });

  it("requires control_number", () => {
    const { control_number: _, ...rest } = validCreate;
    expect(createStudentSchema.safeParse(rest).success).toBe(false);
  });

  it("requires full_name", () => {
    expect(createStudentSchema.safeParse({ ...validCreate, full_name: "" }).success).toBe(false);
  });

  it("requires program", () => {
    const { program: _, ...rest } = validCreate;
    expect(createStudentSchema.safeParse(rest).success).toBe(false);
  });

  it("requires semester", () => {
    const { semester: _, ...rest } = validCreate;
    expect(createStudentSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects semester below 1", () => {
    expect(createStudentSchema.safeParse({ ...validCreate, semester: 0 }).success).toBe(false);
  });

  it("rejects semester above 12", () => {
    expect(createStudentSchema.safeParse({ ...validCreate, semester: 13 }).success).toBe(false);
  });

  it("accepts null email", () => {
    expect(createStudentSchema.safeParse({ ...validCreate, email: null }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(createStudentSchema.safeParse({ ...validCreate, email: "not-an-email" }).success).toBe(false);
  });

  it("accepts is_active boolean", () => {
    expect(createStudentSchema.safeParse({ ...validCreate, is_active: false }).success).toBe(true);
  });
});

describe("updateStudentSchema", () => {
  it("accepts empty object (all optional)", () => {
    expect(updateStudentSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update", () => {
    expect(updateStudentSchema.safeParse({ full_name: "Nuevo Nombre" }).success).toBe(true);
  });
});

describe("studentIdSchema", () => {
  it("accepts valid UUID", () => {
    expect(
      studentIdSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" }).success
    ).toBe(true);
  });

  it("rejects non-UUID string", () => {
    expect(studentIdSchema.safeParse({ id: "not-uuid" }).success).toBe(false);
  });
});

describe("studentStatusSchema", () => {
  it("accepts is_active=true", () => {
    expect(studentStatusSchema.safeParse({ is_active: true }).success).toBe(true);
  });

  it("accepts is_active=false", () => {
    expect(studentStatusSchema.safeParse({ is_active: false }).success).toBe(true);
  });

  it("rejects missing is_active", () => {
    expect(studentStatusSchema.safeParse({}).success).toBe(false);
  });
});

describe("locationQuerySchema", () => {
  it("accepts empty object", () => {
    expect(locationQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid period N=1", () => {
    expect(locationQuerySchema.safeParse({ period: "2026-1" }).success).toBe(true);
  });

  it("accepts valid period N=4", () => {
    expect(locationQuerySchema.safeParse({ period: "2026-4" }).success).toBe(true);
  });

  it("rejects period with N > 4", () => {
    expect(locationQuerySchema.safeParse({ period: "2026-5" }).success).toBe(false);
  });

  it("rejects period with two-digit N", () => {
    expect(locationQuerySchema.safeParse({ period: "2026-10" }).success).toBe(false);
  });

  it("rejects invalid period format", () => {
    expect(locationQuerySchema.safeParse({ period: "2026" }).success).toBe(false);
  });

  it("accepts valid at time", () => {
    expect(locationQuerySchema.safeParse({ at: "09:30" }).success).toBe(true);
  });

  it("accepts boundary times 00:00 and 23:59", () => {
    expect(locationQuerySchema.safeParse({ at: "00:00" }).success).toBe(true);
    expect(locationQuerySchema.safeParse({ at: "23:59" }).success).toBe(true);
  });

  it("rejects at without leading zero", () => {
    expect(locationQuerySchema.safeParse({ at: "9:30" }).success).toBe(false);
  });

  it("rejects invalid hour in at (25:00)", () => {
    expect(locationQuerySchema.safeParse({ at: "25:00" }).success).toBe(false);
  });

  it("rejects invalid minute in at (09:99)", () => {
    expect(locationQuerySchema.safeParse({ at: "09:99" }).success).toBe(false);
  });
});
