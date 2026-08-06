import { beforeEach, describe, expect, it, vi } from "vitest";
import { CampusCatalogService } from "./campus-catalog.service.js";
import { ApiError } from "../../shared/errors/api-error.js";

const mockStreetRow = {
  id: "street-1",
  name: "Avenida Constituyentes",
  alias_text: "constituyentes|calle constituyentes",
  x: 78.033,
  y: 2,
  z: -151.167,
  rotation: 0,
  description: "Vía cercana al límite norte del campus.",
  is_visible: true,
};

const mockQuickQueryRow = {
  id: "quick-1",
  label: "¿Dónde está el director?",
  query: "donde encuentro al director",
  category: "position" as const,
  icon: "user",
  priority: 100,
};

const mockPositionRow = {
  id: "position-1",
  title: "Director del Instituto Tecnológico de Oaxaca",
  alias_text: "director|director del tecnológico",
  person_name: null,
  department_id: null,
  department_name: null,
  building_id: "building-direccion",
  building_name: "DIRECCIÓN",
  office_name: null,
  is_public: true,
  is_active: true,
  search_keywords: ["director", "responsable del instituto"],
};

function createMockRepository() {
  return {
    findStreets: vi.fn(),
    findQuickQueries: vi.fn(),
    findPositions: vi.fn(),
    findPositionById: vi.fn(),
  };
}

function createService() {
  const repository = createMockRepository();
  return {
    repository,
    service: new CampusCatalogService(repository as any),
  };
}

describe("CampusCatalogService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStreets", () => {
    it("maps street rows into the public shape with parsed aliases and coordinates", async () => {
      const { service, repository } = createService();
      repository.findStreets.mockResolvedValue([mockStreetRow]);

      const streets = await service.getStreets();

      expect(streets).toEqual([
        {
          id: "street-1",
          name: "Avenida Constituyentes",
          aliases: ["constituyentes", "calle constituyentes"],
          position: { x: 78.033, y: 2, z: -151.167 },
          rotation: 0,
          description: "Vía cercana al límite norte del campus.",
          isVisible: true,
        },
      ]);
    });

    it("returns an empty alias list when there is no alias text", async () => {
      const { service, repository } = createService();
      repository.findStreets.mockResolvedValue([{ ...mockStreetRow, alias_text: null }]);

      const [street] = await service.getStreets();
      expect(street.aliases).toEqual([]);
    });
  });

  describe("getQuickQueries", () => {
    it("maps quick query rows into the public shape", async () => {
      const { service, repository } = createService();
      repository.findQuickQueries.mockResolvedValue([mockQuickQueryRow]);

      await expect(service.getQuickQueries()).resolves.toEqual([
        {
          id: "quick-1",
          label: "¿Dónde está el director?",
          query: "donde encuentro al director",
          category: "position",
          icon: "user",
          priority: 100,
        },
      ]);
    });
  });

  describe("getPositions", () => {
    it("delegates to repository.findPositions without a building filter", async () => {
      const { service, repository } = createService();
      repository.findPositions.mockResolvedValue([mockPositionRow]);

      const positions = await service.getPositions();

      expect(repository.findPositions).toHaveBeenCalledWith(undefined);
      expect(positions).toEqual([
        {
          id: "position-1",
          title: "Director del Instituto Tecnológico de Oaxaca",
          aliases: ["director", "director del tecnológico"],
          personName: null,
          departmentId: null,
          departmentName: null,
          buildingId: "building-direccion",
          buildingName: "DIRECCIÓN",
          officeName: null,
          isPublic: true,
          isActive: true,
          searchKeywords: ["director", "responsable del instituto"],
        },
      ]);
    });

    it("passes a building filter through to the repository", async () => {
      const { service, repository } = createService();
      repository.findPositions.mockResolvedValue([]);

      await service.getPositions("building-direccion");
      expect(repository.findPositions).toHaveBeenCalledWith("building-direccion");
    });
  });

  describe("getPosition", () => {
    it("returns the mapped position when found", async () => {
      const { service, repository } = createService();
      repository.findPositionById.mockResolvedValue(mockPositionRow);

      const position = await service.getPosition("position-1");
      expect(position.title).toBe("Director del Instituto Tecnológico de Oaxaca");
      expect(repository.findPositionById).toHaveBeenCalledWith("position-1");
    });

    it("throws a 404 ApiError when the position does not exist", async () => {
      const { service, repository } = createService();
      repository.findPositionById.mockResolvedValue(null);

      await expect(service.getPosition("missing")).rejects.toMatchObject(
        new ApiError(404, "Cargo institucional no encontrado")
      );
    });
  });
});
