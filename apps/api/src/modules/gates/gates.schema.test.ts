import { describe, expect, it } from "vitest";
import {
  createGateSchema,
  gateIdSchema,
  gateStatusSchema,
  updateGateSchema,
} from "./gates.schema.js";

describe("createGateSchema", () => {
  it("accepts valid minimal input", () => {
    const result = createGateSchema.safeParse({
      name: "Puerta Norte",
      x: 10,
      z: 20,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid full input", () => {
    const result = createGateSchema.safeParse({
      name: "Puerta Norte",
      description: "Acceso peatonal principal",
      access_type: "vehicular",
      status: "cerrada",
      x: 10.5,
      y: 1.2,
      z: 20.3,
      is_active: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = createGateSchema.safeParse({ x: 1, z: 2 });
    expect(result.success).toBe(false);
  });

  it("rejects missing x", () => {
    const result = createGateSchema.safeParse({ name: "Puerta", z: 2 });
    expect(result.success).toBe(false);
  });

  it("rejects missing z", () => {
    const result = createGateSchema.safeParse({ name: "Puerta", x: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid access_type", () => {
    const result = createGateSchema.safeParse({
      name: "Puerta",
      x: 1,
      z: 2,
      access_type: "volador",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = createGateSchema.safeParse({
      name: "Puerta",
      x: 1,
      z: 2,
      status: "en_reparacion",
    });
    expect(result.success).toBe(false);
  });

  it("accepts each valid access_type value", () => {
    for (const access_type of ["peatonal", "vehicular", "mixto"] as const) {
      expect(
        createGateSchema.safeParse({ name: "Puerta", x: 1, z: 2, access_type }).success
      ).toBe(true);
    }
  });

  it("accepts each valid status value", () => {
    for (const status of ["abierta", "cerrada", "solo_entrada", "solo_salida"] as const) {
      expect(
        createGateSchema.safeParse({ name: "Puerta", x: 1, z: 2, status }).success
      ).toBe(true);
    }
  });

  it("accepts null optional description", () => {
    const result = createGateSchema.safeParse({
      name: "Puerta",
      x: 1,
      z: 2,
      description: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateGateSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateGateSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update with only name", () => {
    expect(updateGateSchema.safeParse({ name: "Nuevo nombre" }).success).toBe(true);
  });

  it("rejects invalid access_type when provided", () => {
    const result = updateGateSchema.safeParse({ access_type: "invalido" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status when provided", () => {
    const result = updateGateSchema.safeParse({ status: "invalido" });
    expect(result.success).toBe(false);
  });
});

describe("gateIdSchema", () => {
  it("accepts valid UUID", () => {
    expect(
      gateIdSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" }).success
    ).toBe(true);
  });

  it("rejects non-UUID string", () => {
    const result = gateIdSchema.safeParse({ id: "not-valid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing id", () => {
    expect(gateIdSchema.safeParse({}).success).toBe(false);
  });
});

describe("gateStatusSchema", () => {
  it("accepts true", () => {
    expect(gateStatusSchema.safeParse({ is_active: true }).success).toBe(true);
  });

  it("accepts false", () => {
    expect(gateStatusSchema.safeParse({ is_active: false }).success).toBe(true);
  });

  it("rejects missing is_active", () => {
    expect(gateStatusSchema.safeParse({}).success).toBe(false);
  });

  it("rejects non-boolean string", () => {
    expect(gateStatusSchema.safeParse({ is_active: "true" }).success).toBe(false);
  });
});
