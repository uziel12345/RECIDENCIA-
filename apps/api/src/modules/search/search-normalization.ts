import type { SearchResultKind, SearchResultRow } from "./search.types.js";

const INTENT_PATTERNS = [
  /\b(?:en\s+)?donde\s+(?:esta|estan|encuentro|encuentra|queda|quedan|trabaja|puedo)\b/g,
  /\b(?:en\s+)?que\s+edificio\b/g,
  /\bquien\s+es\s+(?:el|la)?\s*(?:encargado|encargada|responsable)\b/g,
  /\bquiero\s+(?:tramitar|solicitar|sacar|hacer)\b/g,
  /\bnecesito\s+(?:tramitar|solicitar|sacar|hacer)?\b/g,
] as const;

const STOP_WORDS = new Set([
  "a",
  "al",
  "de",
  "del",
  "el",
  "en",
  "encuentra",
  "encuentro",
  "esta",
  "estan",
  "la",
  "las",
  "lo",
  "los",
  "me",
  "mi",
  "necesito",
  "para",
  "por",
  "puedo",
  "que",
  "quiero",
  "se",
  "sacar",
  "solicitar",
  "tecnologico",
  "trabaja",
  "tramitar",
  "una",
  "uno",
  "un",
]);

const TYPE_WORDS = new Set([
  "aula",
  "cargo",
  "departamento",
  "edificio",
  "oficina",
  "persona",
]);

const TOKEN_SYNONYMS: Record<string, string> = {
  encargado: "responsable",
  encargada: "responsable",
  inscribir: "inscripcion",
  inscribirme: "inscripcion",
  inscribirse: "inscripcion",
  matricula: "inscripcion",
  matricular: "inscripcion",
  reinscribirme: "reinscripcion",
  reinscribir: "reinscripcion",
  registrarme: "inscripcion",
  salon: "aula",
  salones: "aula",
  jefe: "jefatura",
  jefa: "jefatura",
};

const PLURAL_EXCEPTIONS = new Set(["ingles"]);

export type SearchIntent = {
  normalizedQuery: string;
  terms: string[];
  preferredKinds: SearchResultKind[];
};

export function normalizeClassroomCode(value: string): string | null {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/^aula\s+/, "");
  const match = normalized.match(/^([a-z])\s*-?\s*(\d{1,3})$/i);
  return match ? `${match[1].toLowerCase()}-${Number(match[2])}` : null;
}

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()[\]{}'"/\\_]+/g, " ")
    .replace(/\baula\s+([a-z])\s*-?\s*(\d{1,3})\b/g, "$1-$2")
    .replace(/\b([a-z])\s*-?\s*(\d{1,3})\b/g, "$1-$2")
    .replace(/\s+/g, " ")
    .trim();
}

function singularizeToken(token: string): string {
  if (PLURAL_EXCEPTIONS.has(token) || token.length < 5) return token;
  if (token.endsWith("es") && token.length > 6) return token.slice(0, -2);
  if (token.endsWith("s")) return token.slice(0, -1);
  return token;
}

export function tokenizeSearchQuery(value: string): string[] {
  let normalized = normalizeSearchText(value);
  for (const pattern of INTENT_PATTERNS) normalized = normalized.replace(pattern, " ");

  const classroomCode = normalizeClassroomCode(normalized);
  if (classroomCode) return [classroomCode];

  const withoutStopWords = normalized
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token));

  // Las TYPE_WORDS ("aula", "edificio", ...) se descartan cuando acompañan
  // contenido más específico (p. ej. "aula i4" -> solo "i4" importa), pero si
  // son lo único que escribió el usuario ("aula" a secas) deben conservarse:
  // de lo contrario la consulta queda vacía y no encuentra nada.
  const withoutTypeWords = withoutStopWords.filter((token) => !TYPE_WORDS.has(token));
  const meaningfulTokens = withoutTypeWords.length > 0 ? withoutTypeWords : withoutStopWords;

  const tokens = meaningfulTokens
    .map((token) => TOKEN_SYNONYMS[token] ?? token)
    .map(singularizeToken);

  return [...new Set(tokens)];
}

export function interpretSearchIntent(value: string): SearchIntent {
  const normalized = normalizeSearchText(value);
  const preferredKinds: SearchResultKind[] = [];

  const add = (...kinds: SearchResultKind[]) => {
    for (const kind of kinds) {
      if (!preferredKinds.includes(kind)) preferredKinds.push(kind);
    }
  };

  if (/\b(?:aula|salon)\b/.test(normalized) || normalizeClassroomCode(normalized)) {
    add("classroom");
  }
  if (/\b(?:director|jefe|jefa|encargad[oa]|responsable|cargo)\b/.test(normalized)) {
    add("position", "headquarters");
  }
  if (/\b(?:servicio|constancia|inscrip|titulacion|certificado|baja|credencial|residencia|tramite)\w*\b/.test(normalized)) {
    add("service", "procedure");
  }
  if (/\bdepartamento\b/.test(normalized)) add("department");
  if (/\b(?:persona|profesor|profesora|maestro|maestra)\b/.test(normalized)) add("person");
  if (/\boficina\b/.test(normalized)) add("office");
  if (/\b(?:edificio|biblioteca|direccion|centro de computo)\b/.test(normalized)) {
    add("building");
  }
  if (/\b(?:calle|avenida|calzada|acceso)\b/.test(normalized)) add("street", "gate");

  const terms = tokenizeSearchQuery(value);
  return {
    normalizedQuery: terms.join(" ") || normalized,
    terms,
    preferredKinds,
  };
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const old = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      diagonal = old;
    }
  }
  return previous[b.length];
}

function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  return longest === 0 ? 1 : 1 - levenshteinDistance(a, b) / longest;
}

export function calculateSearchScore(
  intent: SearchIntent,
  candidate: Pick<
    SearchResultRow,
    "kind" | "title" | "subtitle" | "description" | "aliases" | "keywords"
  >
): number {
  const query = intent.normalizedQuery;
  const title = normalizeSearchText(candidate.title);
  const aliases = candidate.aliases.map(normalizeSearchText);
  const keywords = candidate.keywords.map(normalizeSearchText);
  const description = normalizeSearchText(
    [candidate.subtitle, candidate.description ?? ""].join(" ")
  );

  let score = 0;
  if (title === query) score = 100;
  else if (aliases.includes(query)) score = 96;
  else if (title.startsWith(query)) score = 84;
  else if (aliases.some((alias) => alias.startsWith(query))) score = 80;

  const searchableTitle = [title, ...aliases].join(" ");
  const matchedTerms = intent.terms.filter((term) =>
    searchableTitle.includes(term)
  ).length;
  const keywordMatches = intent.terms.filter((term) =>
    keywords.some((keyword) => keyword.includes(term))
  ).length;
  const descriptionMatches = intent.terms.filter((term) =>
    description.includes(term)
  ).length;

  if (intent.terms.length > 0) {
    score = Math.max(
      score,
      Math.round((matchedTerms / intent.terms.length) * 70),
      Math.round((keywordMatches / intent.terms.length) * 58),
      Math.round((descriptionMatches / intent.terms.length) * 34)
    );
  }

  const fuzzy = Math.max(
    similarity(query, title),
    ...aliases.map((alias) => similarity(query, alias))
  );
  if (fuzzy >= 0.72) score = Math.max(score, Math.round(fuzzy * 72));

  if (intent.preferredKinds.includes(candidate.kind) && score < 96) score += 12;
  return Math.min(score, 100);
}
