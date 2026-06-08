import { describe, it, expect } from "vitest";
import {
  createProfessorSchema,
  updateProfessorSchema,
  professorIdSchema,
  professorStatusSchema,
  professorEmployeeNumberSchema,
} from "./professors.schema.js";

const validCreate = {
  employee_number: "EMP001",
  full_name: "Dr. Luis Hernández",
  department: "Sistemas y Computación",
};

describe("createProfessorSchema", () => {
  it("accepts valid input", () => {
    expect(createProfessorSchema.safeParse(validCreate).success).toBe(true);
  });

  it("requires employee_number", () => {
    const { employee_number: _, ...rest } = validCreate;
    expect(createProfessorSchema.safeParse(rest).success).toBe(false);
  });

  it("requires full_name", () => {
    expect(createProfessorSchema.safeParse({ ...validCreate, full_name: "" }).success).toBe(false);
  });

  it("requires department", () => {
    const { department: _, ...rest } = validCreate;
    expect(createProfessorSchema.safeParse(rest).success).toBe(false);
  });

  it("accepts null email", () => {
    expect(createProfessorSchema.safeParse({ ...validCreate, email: null }).success).toBe(true);
  });

  it("rejects invalid email format", () => {
    expect(
      createProfessorSchema.safeParse({ ...validCreate, email: "not-valid" }).success
    ).toBe(false);
  });

  it("accepts valid email", () => {
    expect(
      createProfessorSchema.safeParse({ ...validCreate, email: "prof@ito.mx" }).success
    ).toBe(true);
  });

  it("accepts is_active flag", () => {
    expect(
      createProfessorSchema.safeParse({ ...validCreate, is_active: false }).success
    ).toBe(true);
  });
});

describe("updateProfessorSchema", () => {
  it("accepts empty object", () => {
    expect(updateProfessorSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update with just department", () => {
    expect(updateProfessorSchema.safeParse({ department: "Nuevo Dpto" }).success).toBe(true);
  });
});

describe("professorIdSchema", () => {
  it("accepts valid UUID", () => {
    expect(
      professorIdSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" }).success
    ).toBe(true);
  });

  it("rejects non-UUID", () => {
    expect(professorIdSchema.safeParse({ id: "EMP001" }).success).toBe(false);
  });
});

describe("professorStatusSchema", () => {
  it("accepts is_active=true", () => {
    expect(professorStatusSchema.safeParse({ is_active: true }).success).toBe(true);
  });

  it("rejects missing is_active", () => {
    expect(professorStatusSchema.safeParse({}).success).toBe(false);
  });
});

describe("professorEmployeeNumberSchema", () => {
  it("accepts valid employee_number", () => {
    expect(professorEmployeeNumberSchema.safeParse({ employeeNumber: "EMP001" }).success).toBe(true);
  });

  it("rejects empty string", () => {
    expect(professorEmployeeNumberSchema.safeParse({ employeeNumber: "" }).success).toBe(false);
  });
});
