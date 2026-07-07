const mojibakeMap: Record<string, string> = {
  "Ã¡": "á",
  "Ã©": "é",
  "Ã­": "í",
  "Ã³": "ó",
  "Ãº": "ú",
  "Ã±": "ñ",
  "Ã": "Á",
  "Ã‰": "É",
  "Ã": "Í",
  "Ã“": "Ó",
  "Ãš": "Ú",
  "Ã‘": "Ñ",
  "Â¿": "¿",
  "Â¡": "¡",
  "Â·": "·",
  "â€¦": "…",
  "â€”": "—",
  "â€“": "–",
  "â†’": "→",
};

const replacementMap: Record<string, string> = {
  "Descripci�n": "Descripción",
  "descripci�n": "descripción",
  "Informaci�n": "Información",
  "informaci�n": "información",
  "Categor�a": "Categoría",
  "categor�a": "categoría",
  "C�digo": "Código",
  "c�digo": "código",
  "Im�genes": "Imágenes",
  "im�genes": "imágenes",
  "C�mo": "Cómo",
  "c�mo": "cómo",
  "aqu�": "aquí",
  "Ubicaci�n": "Ubicación",
  "ubicaci�n": "ubicación",
  "Precisi�n": "Precisión",
  "precisi�n": "precisión",
  "Navegaci�n": "Navegación",
  "navegaci�n": "navegación",
  "Tr�mite": "Trámite",
  "tr�mite": "trámite",
  "Tr�mites": "Trámites",
  "tr�mites": "trámites",
  "Sesi�n": "Sesión",
  "sesi�n": "sesión",
  "Contrase�a": "Contraseña",
  "contrase�a": "contraseña",
  "P�gina": "Página",
  "p�gina": "página",
  "T�rmino": "Término",
  "t�rmino": "término",
  "Conexi�n": "Conexión",
  "conexi�n": "conexión",
  "Posici�n": "Posición",
  "posici�n": "posición",
  "A�rea": "Aérea",
  "a�rea": "aérea",
};

export function normalizeDisplayText(value: unknown): string {
  if (value === null || value === undefined) return "";

  let text = typeof value === "string" ? value : String(value);

  for (const [bad, good] of Object.entries(mojibakeMap)) {
    text = text.replaceAll(bad, good);
  }

  for (const [bad, good] of Object.entries(replacementMap)) {
    text = text.replaceAll(bad, good);
  }

  return text;
}
