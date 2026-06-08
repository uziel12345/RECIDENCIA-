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

function createMockRepository() {
  return {
    searchBuildings: vi.fn(),
    searchClassrooms: vi.fn(),
    searchProcedures: vi.fn(),
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
    it("runs all four queries in parallel and merges results", async () => {
      const { service, repository } = createService();
      repository.searchBuildings.mockResolvedValue([mockBuilding]);
      repository.searchClassrooms.mockResolvedValue([mockClassroom]);
      repository.searchProcedures
        .mockResolvedValueOnce([mockProcedure]) // tramite
        .mockResolvedValueOnce([mockService]); // servicio

      const results = await service.search("dir", "all");

      expect(results).toHaveLength(4);
      expect(results.map((r) => r.kind)).toEqual([
        "building",
        "classroom",
        "procedure",
        "service",
      ]);
      expect(repository.searchBuildings).toHaveBeenCalledWith("%dir%");
      expect(repository.searchClassrooms).toHaveBeenCalledWith("%dir%");
      expect(repository.searchProcedures).toHaveBeenCalledWith("%dir%", "tramite");
      expect(repository.searchProcedures).toHaveBeenCalledWith("%dir%", "servicio");
    });

    it("returns empty array when all queries return nothing", async () => {
      const { service, repository } = createService();
      repository.searchBuildings.mockResolvedValue([]);
      repository.searchClassrooms.mockResolvedValue([]);
      repository.searchProcedures.mockResolvedValue([]);

      const results = await service.search("xyznotfound", "all");
      expect(results).toHaveLength(0);
    });

    it("wraps search term with % wildcards", async () => {
      const { service, repository } = createService();
      repository.searchBuildings.mockResolvedValue([]);
      repository.searchClassrooms.mockResolvedValue([]);
      repository.searchProcedures.mockResolvedValue([]);

      await service.search("constancia", "all");

      expect(repository.searchBuildings).toHaveBeenCalledWith("%constancia%");
    });
  });

  // ── type = 'building' ────────────────────────────────────────

  describe("type = building", () => {
    it("only calls searchBuildings", async () => {
      const { service, repository } = createService();
      repository.searchBuildings.mockResolvedValue([mockBuilding]);

      const results = await service.search("dir", "building");

      expect(results).toEqual([mockBuilding]);
      expect(repository.searchBuildings).toHaveBeenCalledWith("%dir%");
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
      expect(repository.searchClassrooms).toHaveBeenCalledWith("%101%");
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
        "%constancia%",
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
        "%asesoría%",
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

      const results = await service.search("dir", "all");

      expect(results).toHaveLength(1);
      expect(results[0].kind).toBe("building");
    });

    it("search term is percent-escaped correctly for multi-word term", async () => {
      const { service, repository } = createService();
      repository.searchBuildings.mockResolvedValue([]);
      repository.searchClassrooms.mockResolvedValue([]);
      repository.searchProcedures.mockResolvedValue([]);

      await service.search("control escolar", "all");

      expect(repository.searchBuildings).toHaveBeenCalledWith("%control escolar%");
    });
  });
});
