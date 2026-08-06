const BUILDING_PREFIX = /^edif(?:icio)?(?=\.|\s|$)\.?\s*/iu;

function normalizeLabelPart(value: string): string {
  return value.trim().replace(/\s+/gu, " ");
}

/**
 * Conserva el nombre institucional registrado, pero evita que abreviaturas
 * como "EDIF." lleguen a la interfaz pública.
 */
export function formatBuildingDisplayName(name: string, code = ""): string {
  const normalizedName = normalizeLabelPart(name);
  const normalizedCode = normalizeLabelPart(code).replace(BUILDING_PREFIX, "");
  const nameWithoutPrefix = normalizedName.replace(BUILDING_PREFIX, "").trim();
  const suffix = nameWithoutPrefix || normalizedCode;

  return suffix ? `Edificio ${suffix}` : "Edificio";
}

/** El identificador corto se mantiene como código, nunca como nombre abreviado. */
export function formatBuildingDisplayCode(code: string, name: string): string {
  const normalizedCode = normalizeLabelPart(code).replace(BUILDING_PREFIX, "").trim();
  if (normalizedCode) return normalizedCode;

  const normalizedName = normalizeLabelPart(name);
  return normalizedName.replace(BUILDING_PREFIX, "").trim() || "Edificio";
}
