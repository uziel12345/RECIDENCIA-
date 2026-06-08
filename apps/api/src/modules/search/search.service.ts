import { SearchRepository } from "./search.repository.js";
import type { SearchType } from "./search.schema.js";
import type { SearchResultRow } from "./search.types.js";

export class SearchService {
  constructor(private readonly repository = new SearchRepository()) {}

  async search(q: string, type: SearchType): Promise<SearchResultRow[]> {
    const term = `%${q}%`;

    if (type === "building") return this.repository.searchBuildings(term);
    if (type === "classroom") return this.repository.searchClassrooms(term);
    if (type === "procedure") return this.repository.searchProcedures(term, "tramite");
    if (type === "service") return this.repository.searchProcedures(term, "servicio");

    const [buildings, classrooms, procedures, services] = await Promise.all([
      this.repository.searchBuildings(term),
      this.repository.searchClassrooms(term),
      this.repository.searchProcedures(term, "tramite"),
      this.repository.searchProcedures(term, "servicio"),
    ]);

    return [...buildings, ...classrooms, ...procedures, ...services];
  }
}
