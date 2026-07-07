import { SearchRepository } from "./search.repository.js";
import type { SearchType } from "./search.schema.js";
import type { SearchResultRow } from "./search.types.js";

export class SearchService {
  constructor(private readonly repository = new SearchRepository()) {}

  async search(q: string, type: SearchType): Promise<SearchResultRow[]> {
    // Se busca por palabra en vez de por frase completa, para que el orden o
    // los espacios entre palabras no importen (ej. "control escolar" también
    // encuentra "Servicios Escolares y Control").
    const words = q.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];

    if (type === "building") return this.repository.searchBuildings(words);
    if (type === "classroom") return this.repository.searchClassrooms(words);
    if (type === "procedure") return this.repository.searchProcedures(words, "tramite");
    if (type === "service") return this.repository.searchProcedures(words, "servicio");

    const [buildings, classrooms, procedures, services] = await Promise.all([
      this.repository.searchBuildings(words),
      this.repository.searchClassrooms(words),
      this.repository.searchProcedures(words, "tramite"),
      this.repository.searchProcedures(words, "servicio"),
    ]);

    return [...buildings, ...classrooms, ...procedures, ...services];
  }
}
