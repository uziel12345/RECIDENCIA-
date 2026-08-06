import { SearchRepository } from "./search.repository.js";
import type { SearchType } from "./search.schema.js";
import type {
  SearchCandidateRow,
  SearchResponseRow,
  SearchResultKind,
  SearchResultRow,
} from "./search.types.js";
import {
  calculateSearchScore,
  interpretSearchIntent,
} from "./search-normalization.js";

const MAX_RESULTS = 30;
const MIN_RESULT_SCORE = 22;
const CACHE_TTL_MS = 30_000;
const MAX_CACHE_ENTRIES = 40;

type RepositoryLike = Pick<
  SearchRepository,
  | "searchBuildings"
  | "searchClassrooms"
  | "searchProcedures"
  | "searchDepartments"
  | "searchCubicles"
  | "searchHeadquarters"
  | "searchGates"
  | "searchPositions"
  | "searchStreets"
>;

function splitSearchValues(value: string | null | undefined): string[] {
  return value
    ? [...new Set(value.split("|").map((item) => item.trim()).filter(Boolean))]
    : [];
}

function hydrateCandidate(candidate: SearchCandidateRow): SearchCandidateRow {
  return {
    ...candidate,
    aliases: candidate.aliases ?? splitSearchValues(candidate.aliasText),
    keywords: candidate.keywords ?? splitSearchValues(candidate.keywordText),
  };
}

function toResult(candidate: SearchCandidateRow, score: number): SearchResultRow {
  const result: SearchResultRow = { ...hydrateCandidate(candidate), score };
  delete result.aliasText;
  delete result.keywordText;
  if (
    (candidate.kind === "gate" || candidate.kind === "street") &&
    Number.isFinite(Number(candidate.x)) &&
    Number.isFinite(Number(candidate.z))
  ) {
    result.coordinates = { x: Number(candidate.x), z: Number(candidate.z) };
  }
  delete result.x;
  delete result.z;
  return result;
}

export class SearchService {
  private readonly cache = new Map<
    string,
    { expiresAt: number; response: SearchResponseRow }
  >();

  constructor(private readonly repository: RepositoryLike = new SearchRepository()) {}

  private async candidatesForType(
    terms: string[],
    type: SearchType
  ): Promise<SearchCandidateRow[]> {
    if (type === "building") return this.repository.searchBuildings(terms);
    if (type === "classroom") return this.repository.searchClassrooms(terms);
    if (type === "procedure") return this.repository.searchProcedures(terms, "tramite");
    if (type === "service") return this.repository.searchProcedures(terms, "servicio");
    if (type === "department") return this.repository.searchDepartments(terms);
    if (type === "cubicle") return this.repository.searchCubicles(terms);
    if (type === "headquarters") return this.repository.searchHeadquarters(terms);
    if (type === "gate") return this.repository.searchGates(terms);
    if (type === "position") return this.repository.searchPositions(terms);
    if (type === "street") return this.repository.searchStreets(terms);
    if (type === "person") return this.repository.searchCubicles(terms);
    if (type === "office") return this.repository.searchClassrooms(terms);

    const groups = await Promise.all([
      this.repository.searchBuildings(terms),
      this.repository.searchClassrooms(terms),
      this.repository.searchProcedures(terms, "tramite"),
      this.repository.searchProcedures(terms, "servicio"),
      this.repository.searchDepartments(terms),
      this.repository.searchCubicles(terms),
      this.repository.searchHeadquarters(terms),
      this.repository.searchGates(terms),
      this.repository.searchPositions(terms),
      this.repository.searchStreets(terms),
    ]);
    return groups.flat();
  }

  async search(q: string, type: SearchType): Promise<SearchResponseRow> {
    const intent = interpretSearchIntent(q);
    if (intent.terms.length === 0) {
      return { query: q, normalizedQuery: intent.normalizedQuery, results: [], suggestions: [] };
    }

    const cacheKey = `${type}:${intent.normalizedQuery}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.response, query: q };
    }

    const candidates = await this.candidatesForType(intent.terms, type);
    const seen = new Set<string>();
    const ranked = candidates
      .map(hydrateCandidate)
      .map((candidate) => ({
        candidate,
        score: calculateSearchScore(intent, candidate),
      }))
      .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title))
      .filter(({ candidate, score }) => {
        if (score < MIN_RESULT_SCORE) return false;
        const key = `${candidate.kind}:${candidate.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    const results = ranked
      .slice(0, MAX_RESULTS)
      .map(({ candidate, score }) => toResult(candidate, score));
    const resultTitles = new Set(results.map((result) => result.title));
    const suggestions = candidates
      .map(hydrateCandidate)
      .filter((candidate) => !resultTitles.has(candidate.title))
      .sort(
        (a, b) =>
          calculateSearchScore(intent, b) - calculateSearchScore(intent, a)
      )
      .map((candidate) => candidate.title)
      .filter((title, index, all) => all.indexOf(title) === index)
      .slice(0, 4);

    const response = {
      query: q,
      normalizedQuery: intent.normalizedQuery,
      results,
      suggestions,
    };
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value as string | undefined;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, response });
    return response;
  }
}

export const SEARCH_RESULT_KINDS: SearchResultKind[] = [
  "building",
  "classroom",
  "procedure",
  "service",
  "department",
  "cubicle",
  "headquarters",
  "gate",
  "position",
  "street",
  "person",
  "office",
];
