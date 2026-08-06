import { searchApi, getProcedureDetailApi } from "@ito-map/shared";
import type { SearchResponse, ProcedureWithDetails } from "@ito-map/shared";

const SEARCH_CACHE_TTL_MS = 30_000;
const searchCache = new Map<string, { expiresAt: number; response: SearchResponse }>();

export async function searchAll(q: string, signal?: AbortSignal): Promise<SearchResponse> {
  const key = q.trim().toLocaleLowerCase("es-MX");
  const cached = searchCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.response, query: q };
  }

  const response = await searchApi(q, "all", signal);
  searchCache.set(key, { expiresAt: Date.now() + SEARCH_CACHE_TTL_MS, response });
  return response;
}

export async function getProcedureDetail(id: string): Promise<ProcedureWithDetails> {
  return getProcedureDetailApi(id);
}
