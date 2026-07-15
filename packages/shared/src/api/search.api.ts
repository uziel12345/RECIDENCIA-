import { apiGet } from "./client.js";
import type { SearchResult, SearchResultKind } from "../types/search.types.js";
import type { ProcedureWithDetails } from "../types/procedure.types.js";

export function searchApi(
  q: string,
  type: "all" | SearchResultKind = "all"
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q, type });
  return apiGet<SearchResult[]>(`/search?${params.toString()}`);
}

export function getProcedureDetailApi(id: string): Promise<ProcedureWithDetails> {
  return apiGet<ProcedureWithDetails>(`/procedures/${id}`);
}
