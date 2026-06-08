import { describe, expect, it } from "vitest";
import { createAdminUserSchema } from "./auth.schema.js";

const validBase = {
  username: "operador",
  full_name: "Operador ITO",
  email: "operador@ito.edu.mx",
  role: "admin" as const,
  is_active: true,
};

describe("createAdminUserSchema — validación de contraseña", () => {
  it("acepta contraseña válida de 12+ chars con mayúscula, minúscula y dígito", () => {
    const result = createAdminUserSchema.safeParse({
      ...validBase,
      password: "Segura@12345",
    });
    expect(result.success).toBe(true);
  });

  it("acepta contraseña en el mínimo exacto (12 chars)", () => {
    const result = createAdminUserSchema.safeParse({
      ...validBase,
      password: "Abcdefghij1k",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza contraseña con menos de 12 caracteres", () => {
    const result = createAdminUserSchema.safeParse({
      ...validBase,
      password: "Corta@12",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/12 caracteres/);
  });

  it("rechaza contraseña sin mayúscula", () => {
    const result = createAdminUserSchema.safeParse({
      ...validBase,
      password: "sinmayuscula1234",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/mayúscula/);
  });

  it("rechaza contraseña sin minúscula", () => {
    const result = createAdminUserSchema.safeParse({
      ...validBase,
      password: "SINMINUSCULA1234",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/minúscula/);
  });

  it("rechaza contraseña sin dígito", () => {
    const result = createAdminUserSchema.safeParse({
      ...validBase,
      password: "SinDigitoSeguro",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/dígito/);
  });
});
