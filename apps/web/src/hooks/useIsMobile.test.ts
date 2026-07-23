import { describe, expect, it } from "vitest";
import { shouldUseMobileLayout } from "./useIsMobile";

describe("shouldUseMobileLayout", () => {
  it("mantiene el flujo móvil al rotar un teléfono", () => {
    expect(shouldUseMobileLayout(915, 412, true)).toBe(true);
  });

  it("no convierte una pantalla de escritorio baja en móvil", () => {
    expect(shouldUseMobileLayout(1366, 600, false)).toBe(false);
  });

  it("conserva el comportamiento móvil por ancho en vertical", () => {
    expect(shouldUseMobileLayout(390, 844, true)).toBe(true);
  });

  it("permite el layout amplio en una tableta horizontal con altura suficiente", () => {
    expect(shouldUseMobileLayout(1024, 768, true)).toBe(false);
  });
});
