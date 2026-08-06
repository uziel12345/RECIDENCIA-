import { describe, expect, it, vi } from "vitest";
import { SearchService } from "./search.service.js";
import type { SearchCandidateRow } from "./search.types.js";

const candidates: SearchCandidateRow[] = [
  {
    id: "building-direccion",
    kind: "building",
    title: "Dirección",
    subtitle: "DIR · Administrativo",
    buildingId: "building-direccion",
    buildingName: "Dirección",
    description: "Edificio de Dirección",
    aliases: ["direccion general"],
    keywords: ["dir", "administracion"],
    validationStatus: "confirmed",
  },
  {
    id: "position-director",
    kind: "position",
    title: "Director del Instituto Tecnológico de Oaxaca",
    subtitle: "Cargo institucional · Dirección",
    buildingId: "building-direccion",
    buildingName: "Dirección",
    description: null,
    aliases: ["director", "director del tecnologico"],
    keywords: ["direccion", "responsable"],
    validationStatus: "confirmed",
  },
  {
    id: "service-inscripcion",
    kind: "service",
    title: "Inscripción",
    subtitle: "Servicio",
    buildingId: null,
    buildingName: null,
    description: null,
    aliases: ["inscripcion de estudiantes"],
    keywords: ["registro escolar"],
    validationStatus: "pending_validation",
  },
  {
    id: "building-servicios-escolares",
    kind: "building",
    title: "Servicios Escolares",
    subtitle: "SERV-ESC · Servicio",
    buildingId: "building-servicios-escolares",
    buildingName: "Servicios Escolares",
    description: null,
    aliases: ["control escolar"],
    keywords: ["servicios escolares"],
    validationStatus: "confirmed",
  },
  {
    id: "service-constancia-social",
    kind: "service",
    title: "Constancia de terminación de servicio social",
    subtitle: "Servicio",
    buildingId: null,
    buildingName: null,
    description: null,
    aliases: ["constancia de servicio social"],
    keywords: ["constancia", "servicio social"],
    validationStatus: "pending_validation",
  },
  {
    id: "service-constancia-ingles",
    kind: "service",
    title: "Constancia de terminación de inglés",
    subtitle: "Servicio",
    buildingId: null,
    buildingName: null,
    description: null,
    aliases: ["terminacion de ingles", "constancia de ingles"],
    keywords: ["constancia", "ingles"],
    validationStatus: "pending_validation",
  },
  {
    id: "service-actividades",
    kind: "service",
    title: "Constancia de actividades complementarias",
    subtitle: "Servicio",
    buildingId: null,
    buildingName: null,
    description: null,
    aliases: ["actividades complementarias"],
    keywords: ["liberacion", "actividades complementarias"],
    validationStatus: "pending_validation",
  },
  {
    id: "classroom-i4",
    kind: "classroom",
    title: "I4",
    subtitle: "I4 · Edificio I",
    buildingId: "building-i",
    buildingName: "Edificio I",
    description: null,
    aliases: ["i-4", "aula i4"],
    keywords: ["aula"],
    validationStatus: "confirmed",
  },
  {
    id: "department-sistemas",
    kind: "department",
    title: "Departamento de Sistemas y Computación",
    subtitle: "Departamento · Edificio I",
    buildingId: "building-i",
    buildingName: "Edificio I",
    description: null,
    aliases: ["sistemas y computacion"],
    keywords: ["sistemas"],
    validationStatus: "confirmed",
  },
  {
    id: "building-biblioteca",
    kind: "building",
    title: "Centro de Información (Biblioteca)",
    subtitle: "CI · Biblioteca",
    buildingId: "building-biblioteca",
    buildingName: "Centro de Información (Biblioteca)",
    description: null,
    aliases: ["biblioteca"],
    keywords: ["centro de informacion"],
    validationStatus: "confirmed",
  },
  {
    id: "building-computo",
    kind: "building",
    title: "Centro de Cómputo",
    subtitle: "CC · Laboratorio",
    buildingId: "building-computo",
    buildingName: "Centro de Cómputo",
    description: null,
    aliases: ["centro de computo"],
    keywords: ["computo"],
    validationStatus: "confirmed",
  },
];

function createRepository() {
  const byKind = (kind: SearchCandidateRow["kind"]) =>
    candidates.filter((candidate) => candidate.kind === kind);
  return {
    searchBuildings: vi.fn().mockResolvedValue(byKind("building")),
    searchClassrooms: vi.fn().mockResolvedValue(byKind("classroom")),
    searchProcedures: vi.fn((_terms: string[], kind: "tramite" | "servicio") =>
      Promise.resolve(kind === "servicio" ? byKind("service") : [])
    ),
    searchDepartments: vi.fn().mockResolvedValue(byKind("department")),
    searchCubicles: vi.fn().mockResolvedValue([]),
    searchHeadquarters: vi.fn().mockResolvedValue([]),
    searchGates: vi.fn().mockResolvedValue([]),
    searchPositions: vi.fn().mockResolvedValue(byKind("position")),
    searchStreets: vi.fn().mockResolvedValue([]),
  };
}

describe("SearchService", () => {
  it.each(["direccion", "dirección", "DIRECCIÓN", "  dirección  "])(
    "finds Dirección for %s",
    async (query) => {
      const service = new SearchService(createRepository());
      const response = await service.search(query, "all");
      expect(response.results[0]).toMatchObject({
        kind: "building",
        title: "Dirección",
      });
    }
  );

  it.each(["director", "donde encuentro al director", "dónde encuentro al director del tecnológico"])(
    "finds and locates the director for %s",
    async (query) => {
      const service = new SearchService(createRepository());
      const response = await service.search(query, "all");
      expect(response.normalizedQuery).toBe("director");
      expect(response.results[0]).toMatchObject({
        kind: "position",
        buildingName: "Dirección",
      });
    }
  );

  it.each(["inscripcion", "inscripción", "quiero inscribirme"])(
    "normalizes registration query %s",
    async (query) => {
      const service = new SearchService(createRepository());
      const response = await service.search(query, "all");
      expect(response.results[0]).toMatchObject({
        kind: "service",
        validationStatus: "pending_validation",
      });
    }
  );

  it.each([
    ["servicios escolares", "building-servicios-escolares"],
    ["constancia de servicio social", "service-constancia-social"],
    ["constancia de terminación de inglés", "service-constancia-ingles"],
    ["actividades complementarias", "service-actividades"],
  ])("finds the expected catalog entry for %s", async (query, expectedId) => {
    const response = await new SearchService(createRepository()).search(query, "all");
    expect(response.results[0]?.id).toBe(expectedId);
  });

  it.each(["I4", "I-4", "aula i 4"])("finds classroom with %s", async (query) => {
    const service = new SearchService(createRepository());
    const response = await service.search(query, "all");
    expect(response.results[0]).toMatchObject({ id: "classroom-i4", kind: "classroom" });
  });

  it.each([
    ["sistemas", "department-sistemas"],
    ["departamento de sistemas", "department-sistemas"],
    ["biblioteca", "building-biblioteca"],
    ["centro de cómputo", "building-computo"],
  ])("finds the expected campus discovery entry for %s", async (query, expectedId) => {
    const response = await new SearchService(createRepository()).search(query, "all");
    expect(response.results[0]?.id).toBe(expectedId);
  });

  it("still returns classrooms when searching the bare word 'aula'", async () => {
    const response = await new SearchService(createRepository()).search("aula", "all");
    expect(response.results.some((result) => result.kind === "classroom")).toBe(true);
  });

  it("passes only meaningful terms to repositories", async () => {
    const repository = createRepository();
    const service = new SearchService(repository);
    await service.search("¿Dónde encuentro al director del tecnológico?", "all");
    expect(repository.searchPositions).toHaveBeenCalledWith(["director"]);
  });

  it("returns a typed empty response for an unknown service", async () => {
    const repository = createRepository();
    Object.values(repository).forEach((mock) => mock.mockResolvedValue([]));
    const service = new SearchService(repository);
    await expect(service.search("servicio inexistente", "all")).resolves.toMatchObject({
      results: [],
      suggestions: [],
    });
  });

  it("does not query the repository for an empty string", async () => {
    const repository = createRepository();
    const service = new SearchService(repository);
    const response = await service.search("   ", "all");
    expect(response.results).toEqual([]);
    expect(repository.searchBuildings).not.toHaveBeenCalled();
  });

  it("attaches coordinates to streets and gates only", async () => {
    const repository = createRepository();
    repository.searchStreets.mockResolvedValue([
      {
        id: "street-1",
        kind: "street",
        title: "Avenida Constituyentes",
        subtitle: "Calle cercana al campus",
        buildingId: null,
        buildingName: null,
        aliases: [],
        keywords: ["avenida"],
        x: 10,
        z: 20,
      },
    ]);
    const response = await new SearchService(repository).search("avenida", "street");
    expect(response.results[0].coordinates).toEqual({ x: 10, z: 20 });
  });
});
