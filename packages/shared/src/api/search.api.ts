import { apiGet } from "./client.js";
import type { SearchResult } from "../types/search.types.js";
import type { ProcedureWithDetails } from "../types/procedure.types.js";

export function searchApi(
  q: string,
  type: "all" | "building" | "classroom" | "procedure" | "service" = "all"
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q, type });
  return apiGet<SearchResult[]>(`/search?${params.toString()}`);
}

export function getProcedureDetailApi(id: string): Promise<ProcedureWithDetails> {
  return apiGet<ProcedureWithDetails>(`/procedures/${id}`);
}
