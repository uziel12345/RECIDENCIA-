import { searchApi, getProcedureDetailApi } from "@ito-map/shared";
import type { SearchResult, ProcedureWithDetails } from "@ito-map/shared";

export async function searchAll(q: string): Promise<SearchResult[]> {
  return searchApi(q, "all");
}

export async function getProcedureDetail(id: string): Promise<ProcedureWithDetails> {
  return getProcedureDetailApi(id);
}
