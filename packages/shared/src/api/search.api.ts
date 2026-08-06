import { apiGet } from "./client.js";
import type { SearchResponse, SearchResultKind } from "../types/search.types.js";
import type { ProcedureWithDetails } from "../types/procedure.types.js";

export function searchApi(
  q: string,
  type: "all" | SearchResultKind = "all",
  signal?: AbortSignal
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q, type });
  return apiGet<SearchResponse>(`/search?${params.toString()}`, { signal });
}

export function getProcedureDetailApi(id: string): Promise<ProcedureWithDetails> {
  return apiGet<ProcedureWithDetails>(`/procedures/${id}`);
}
