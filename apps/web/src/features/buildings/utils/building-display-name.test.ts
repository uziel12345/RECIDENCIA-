import { describe, expect, it } from "vitest";
import {
  formatBuildingDisplayCode,
  formatBuildingDisplayName,
} from "./building-display-name";

describe("building display names", () => {
  it("reemplaza la abreviatura EDIF. por el nombre completo", () => {
    expect(formatBuildingDisplayName("EDIF. E", "E")).toBe("Edificio E");
    expect(formatBuildingDisplayName("Edif.F", "F")).toBe("Edificio F");
  });

  it("agrega Edificio cuando el nombre no incluye el tipo de lugar", () => {
    expect(formatBuildingDisplayName("Biblioteca", "BIB")).toBe(
      "Edificio Biblioteca",
    );
  });

  it("no duplica el prefijo cuando el nombre ya está completo", () => {
    expect(formatBuildingDisplayName("Edificio de Dirección", "DIR")).toBe(
      "Edificio de Dirección",
    );
  });

  it("limpia el prefijo del código visual", () => {
    expect(formatBuildingDisplayCode("EDIF. E", "EDIF. E")).toBe("E");
  });
});
