function normalizeSearchText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * True si cada palabra de `query` aparece en algún lugar de `haystack`, sin
 * importar el orden ni cuántos espacios las separen. Ignora acentos y
 * mayúsculas/minúsculas. Ej: matchesSearchWords("Servicios Escolares", "escolar servicios") -> true.
 */
export function matchesSearchWords(haystack: string, query: string): boolean {
  const words = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const normalizedHaystack = normalizeSearchText(haystack);
  return words.every((word) => normalizedHaystack.includes(word));
}
