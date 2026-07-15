import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchService } from "./search.service.js";

const mockBuilding = {
  id: "b-1",
  kind: "building" as const,
  title: "Dirección",
  subtitle: "DIR · Administrativo",
  buildingId: "b-1",
  buildingName: "Dirección",
};

const mockClassroom = {
  id: "c-1",
  kind: "classroom" as const,
  title: "Aula 101",
  subtitle: "A-101 · Dirección",
  buildingId: "b-1",
  buildingName: "Dirección",
};

const mockProcedure = {
  id: "p-1",
  kind: "procedure" as const,
  title: "Constancia de estudios",
  subtitle: "Trámite",
  buildingId: "b-1",
  buildingName: "Dirección",
};

const mockService = {
  id: "s-1",
  kind: "service" as const,
  title: "Asesoría estudiantil",
  subtitle: "Servicio",
  buildingId: "b-1",
  buildingName: "Dirección",
};

const mockDepartment = {
  id: "d-1",
  kind: "department" as const,
  title: "Departamento de Sistemas",
  subtitle: "Departamento · Dirección",
  buildingId: "b-1",
  buildingName: "Dirección",
};

const mockCubicle = {
  id: "cub-1",
  kind: "cubicle" as const,
  title: "CUB-1",
  subtitle: "Prof. Juan Pérez · Dirección",
  buildingId: "b-1",
  buildingName: "Dirección",
};

const mockHeadquarters = {
  id: "hq-1",
  kind: "headquarters" as const,
  title: "Jefatura de Sistemas",
  subtitle: "Jefatura · Dirección",
  buildingId: "b-1",
  buildingName: "Dirección",
};

const mockGate = {
  id: "g-1",
  kind: "gate" as const,
  title: "Puerta Principal",
  subtitle: "Acceso al campus",
  buildingId: null,
  buildingName: null,
  x: 10,
  z: 20,
};

function createMockRepository() {
  return {
    searchBuildings: vi.fn(),
    searchClassrooms: vi.fn(),
    searchProcedures: vi.fn(),
    searchDepartments: vi.fn().mockResolvedValue([]),
    searchCubicles: vi.fn().mockResolvedValue([]),
    searchHeadquarters: vi.fn().mockResolvedValue([]),
    searchGates: vi.fn().mockResolvedValue([]),
  };
}

function createService() {
  const repository = createMockRepository();
  return { repository, service: new SearchService(repository as any) };
}

describe("SearchService", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── type = 'all' ─────────────────────────────────────────────

  describe("type = all", () => {
    it("runs all eight queries in parallel and merges results in order", async () => {
      const { service, repository } = createService();
      repository.searchBuildings.mockResolvedValue([mockBuilding]);
      repository.searchClassrooms.mockResolvedValue([mockClassroom]);
      repository.searchProcedures
        .mockResolvedValueOnce([mockProcedure]) // tramite
        .mockResolvedValueOnce([mockService]); // servicio
      repository.searchDepartments.mockResolvedValue([mockDepartment]);
      repository.searchCubicles.mockResolvedValue([mockCubicle]);
      repository.searchHeadquarters.mockResolvedValue([mockHeadquarters]);
      repository.searchGates.mockResolvedValue([mockGate]);

      const results = await service.search("dir", "all");

      expect(results).toHaveLength(8);
      expect(results.map((r) => r.kind)).toEqual([
        "building",
        "classroom",
        "procedure",
        "service",
        "department",
        "cubicle",
        "headquarters",
        "gate",
      ]);
      expect(repository.searchBuildings).toHaveBeenCalledWith(["dir"]);
      expect(repository.searchClassrooms).toHaveBeenCalledWith(["dir"]);
      expect(repository.searchProcedures).toHaveBeenCalledWith(["dir"], "tramite");
      expect(repository.searchProcedures).toHaveBeenCalledWith(["dir"], "servicio");
      expect(repository.searchDepartments).toHaveBeenCalledWith(["dir"]);
      expect(repository.searchCubicles).toHaveBeenCalledWith(["dir"]);
      expect(repository.searchHeadquarters).toHaveBeenCalledWith(["dir"]);
      expect(repository.searchGates).toHaveBeenCalledWith(["dir"]);
    });

    it("attaches coordinates only to gate results", async () => {
      const { service, repository } = createService();
      repository.searchBuildings.mockResolvedValue([]);
      repository.searchClassrooms.mockResolvedValue([]);
      repository.searchProcedures.mockResolvedValue([]);
      repository.searchDepartments.mockResolvedValue([]);
      repository.searchCubicles.mockResolvedValue([]);
      repository.searchHeadquarters.mockResolvedValue([]);
      repository.searchGates.mockResolvedValue([mockGate]);

      const results = await service.search("puerta", "all");

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        kind: "gate",
        coordinates: { x: 10, z: 20 },
      });
      expect((results[0] as any).x).toBeUndefined();
      expect((results[0] as any).z).toBeUndefined();
    });

    it("returns empty array when all queries return nothing", async () => {
      const { service, repository } = createService();
      repository.searchBuildings.mockResolvedValue([]);
      repository.searchClassrooms.mockResolvedValue([]);
      repository.searchProcedures.mockResolvedValue([]);
      repository.searchDepartments.mockResolvedValue([]);
      repository.searchCubicles.mockResolvedValue([]);
      repository.searchHeadquarters.mockResolvedValue([]);
      repository.searchGates.mockResolvedValue([]);

      const results = await service.search("xyznotfound", "all");
      expect(results).toHaveLength(0);
    });

    it("passes a single-element word array for a one-word term", async () => {
      const { service, repository } = createService();
      repository.searchBuildings.mockResolvedValue([]);
      repository.searchClassrooms.mockResolvedValue([]);
      repository.searchProcedures.mockResolvedValue([]);
      repository.searchDepartments.mockResolvedValue([]);
      repository.searchCubicles.mockResolvedValue([]);
      repository.searchHeadquarters.mockResolvedValue([]);
      repository.searchGates.mockResolvedValue([]);

      await service.search("constancia", "all");

      expect(repository.searchBuildings).toHaveBeenCalledWith(["constancia"]);
    });
  });

  // ── type = 'department' ──────────────────────────────────────

  describe("type = department", () => {
    it("only calls searchDepartments", async () => {
      const { service, repository } = createService();
      repository.searchDepartments.mockResolvedValue([mockDepartment]);

      const results = await service.search("sistemas", "department");

      expect(results).toEqual([mockDepartment]);
      expect(repository.searchDepartments).toHaveBeenCalledWith(["sistemas"]);
      expect(repository.searchBuildings).not.toHaveBeenCalled();
    });
  });

  // ── type = 'cubicle' ──────────────────────────────────────────

  describe("type = cubicle", () => {
    it("only calls searchCubicles", async () => {
      const { service, repository } = createService();
      repository.searchCubicles.mockResolvedValue([mockCubicle]);

      const results = await service.search("cub-1", "cubicle");

      expect(results).toEqual([mockCubicle]);
      expect(repository.searchCubicles).toHaveBeenCalledWith(["cub-1"]);
      expect(repository.searchBuildings).not.toHaveBeenCalled();
    });
  });

  // ── type = 'headquarters' ─────────────────────────────────────

  describe("type = headquarters", () => {
    it("only calls searchHeadquarters", async () => {
      const { service, repository } = createService();
      repository.searchHeadquarters.mockResolvedValue([mockHeadquarters]);

      const results = await service.search("jefatura", "headquarters");

      expect(results).toEqual([mockHeadquarters]);
      expect(repository.searchHeadquarters).toHaveBeenCalledWith(["jefatura"]);
      expect(repository.searchBuildings).not.toHaveBeenCalled();
    });
  });

  // ── type = 'gate' ─────────────────────────────────────────────

  describe("type = gate", () => {
    it("calls searchGates and attaches coordinates", async () => {
      const { service, repository } = createService();
      repository.searchGates.mockResolvedValue([mockGate]);

      const results = await service.search("puerta", "gate");

      expect(repository.searchGates).toHaveBeenCalledWith(["puerta"]);
      expect(results).toEqual([
        {
          id: "g-1",
          kind: "gate",
          title: "Puerta Principal",
          subtitle: "Acceso al campus",
          buildingId: null,
          buildingName: null,
          coordinates: { x: 10, z: 20 },
        },
      ]);
    });
  });

  // ── type = 'building' ────────────────────────────────────────

  describe("type = building", () => {
    it("only calls searchBuildings", async () => {
      const { service, repository } = createService();
      repository.searchBuildings.mockResolvedValue([mockBuilding]);

      const results = await service.search("dir", "building");

      expect(results).toEqual([mockBuilding]);
      expect(repository.searchBuildings).toHaveBeenCalledWith(["dir"]);
      expect(repository.searchClassrooms).not.toHaveBeenCalled();
      expect(repository.searchProcedures).not.toHaveBeenCalled();
    });
  });

  // ── type = 'classroom' ───────────────────────────────────────

  describe("type = classroom", () => {
    it("only calls searchClassrooms", async () => {
      const { service, repository } = createService();
      repository.searchClassrooms.mockResolvedValue([mockClassroom]);

      const results = await service.search("101", "classroom");

      expect(results).toEqual([mockClassroom]);
      expect(repository.searchClassrooms).toHaveBeenCalledWith(["101"]);
      expect(repository.searchBuildings).not.toHaveBeenCalled();
      expect(repository.searchProcedures).not.toHaveBeenCalled();
    });
  });

  // ── type = 'procedure' ───────────────────────────────────────

  describe("type = procedure", () => {
    it("calls searchProcedures with kind=tramite", async () => {
      const { service, repository } = createService();
      repository.searchProcedures.mockResolvedValue([mockProcedure]);

      const results = await service.search("constancia", "procedure");

      expect(results).toEqual([mockProcedure]);
      expect(repository.searchProcedures).toHaveBeenCalledWith(
        ["constancia"],
        "tramite"
      );
      expect(repository.searchBuildings).not.toHaveBeenCalled();
      expect(repository.searchClassrooms).not.toHaveBeenCalled();
    });
  });

  // ── type = 'service' ─────────────────────────────────────────

  describe("type = service", () => {
    it("calls searchProcedures with kind=servicio", async () => {
      const { service, repository } = createService();
      repository.searchProcedures.mockResolvedValue([mockService]);

      const results = await service.search("asesoría", "service");

      expect(results).toEqual([mockService]);
      expect(repository.searchProcedures).toHaveBeenCalledWith(
        ["asesoría"],
        "servicio"
      );
      expect(repository.searchBuildings).not.toHaveBeenCalled();
    });
  });

  // ── mixed partial results ────────────────────────────────────

  describe("partial results", () => {
    it("type=all returns results even when some queries return empty", async () => {
      const { service, repository } = createService();
      repository.searchBuildings.mockResolvedValue([mockBuilding]);
      repository.searchClassrooms.mockResolvedValue([]);
      repository.searchProcedures.mockResolvedValue([]);
      repository.searchDepartments.mockResolvedValue([]);
      repository.searchCubicles.mockResolvedValue([]);
      repository.searchHeadquarters.mockResolvedValue([]);
      repository.searchGates.mockResolvedValue([]);

      const results = await service.search("dir", "all");

      expect(results).toHaveLength(1);
      expect(results[0].kind).toBe("building");
    });

    it("splits a multi-word term into one array element per word, in order", async () => {
      const { service, repository } = createService();
      repository.searchBuildings.mockResolvedValue([]);
      repository.searchClassrooms.mockResolvedValue([]);
      repository.searchProcedures.mockResolvedValue([]);
      repository.searchDepartments.mockResolvedValue([]);
      repository.searchCubicles.mockResolvedValue([]);
      repository.searchHeadquarters.mockResolvedValue([]);
      repository.searchGates.mockResolvedValue([]);

      await service.search("control escolar", "all");

      expect(repository.searchBuildings).toHaveBeenCalledWith([
        "control",
        "escolar",
      ]);
    });

    it("collapses repeated whitespace between words", async () => {
      const { service, repository } = createService();
      repository.searchBuildings.mockResolvedValue([]);
      repository.searchClassrooms.mockResolvedValue([]);
      repository.searchProcedures.mockResolvedValue([]);
      repository.searchDepartments.mockResolvedValue([]);
      repository.searchCubicles.mockResolvedValue([]);
      repository.searchHeadquarters.mockResolvedValue([]);
      repository.searchGates.mockResolvedValue([]);

      await service.search("  control   escolar  ", "all");

      expect(repository.searchBuildings).toHaveBeenCalledWith([
        "control",
        "escolar",
      ]);
    });
  });
});
