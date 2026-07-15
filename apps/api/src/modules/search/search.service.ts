import { SearchRepository } from "./search.repository.js";
import type { SearchType } from "./search.schema.js";
import type { SearchResultRow } from "./search.types.js";

// Solo las filas de kind="gate" llevan coordenadas — el resto de kinds
// resuelve su posición a través del edificio ya cargado en el frontend.
function withGateCoordinates(
  rows: Array<SearchResultRow & { x?: number; z?: number }>
): SearchResultRow[] {
  return rows.map((row) => {
    if (row.kind !== "gate") return row;
    const { x, z, ...rest } = row;
    return { ...rest, coordinates: { x, z } } as SearchResultRow;
  });
}

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
    if (type === "department") return this.repository.searchDepartments(words);
    if (type === "cubicle") return this.repository.searchCubicles(words);
    if (type === "headquarters") return this.repository.searchHeadquarters(words);
    if (type === "gate") return withGateCoordinates(await this.repository.searchGates(words));

    const [buildings, classrooms, procedures, services, departments, cubicles, headquarters, gates] =
      await Promise.all([
        this.repository.searchBuildings(words),
        this.repository.searchClassrooms(words),
        this.repository.searchProcedures(words, "tramite"),
        this.repository.searchProcedures(words, "servicio"),
        this.repository.searchDepartments(words),
        this.repository.searchCubicles(words),
        this.repository.searchHeadquarters(words),
        this.repository.searchGates(words),
      ]);

    return [
      ...buildings,
      ...classrooms,
      ...procedures,
      ...services,
      ...departments,
      ...cubicles,
      ...headquarters,
      ...withGateCoordinates(gates),
    ];
  }
}
