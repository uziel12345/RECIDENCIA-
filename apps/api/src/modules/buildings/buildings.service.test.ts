import { beforeEach, describe, expect, it, vi } from "vitest";
import { BuildingsService } from "./buildings.service.js";
import { ApiError } from "../../shared/errors/api-error.js";

const mockBuilding = {
  id: "building-1",
  code: "EDIF-A",
  name: "Edificio A",
  slug: "edificio-a",
  description: "Edificio principal",
  model_node_name: "Building_A",
  x: 1,
  y: 2,
  z: 3,
  latitude: 17.073,
  longitude: -96.726,
  is_active: true,
  is_priority: false,
  category_code: "ACADEMIC",
  category_name: "Académico",
  category_color: "#2563eb",
  cover_image_url: null,
};

function createMockRepository() {
  return {
    findAllActive: vi.fn(),
    findAllForAdminPaginated: vi.fn(),
    findAllForAdmin: vi.fn(),
    findById: vi.fn(),
    findImagesByBuildingId: vi.fn(),
    findCategoryIdByCode: vi.fn(),
    createBuilding: vi.fn(),
    updateBuilding: vi.fn(),
    updateBuildingStatus: vi.fn(),
    softDeleteBuilding: vi.fn(),
    findAllCategories: vi.fn(),
  };
}

function createService() {
  const repository = createMockRepository();

  return {
    repository,
    service: new BuildingsService(repository as any),
  };
}

describe("BuildingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAll delegates to repository.findAllActive", async () => {
    const { service, repository } = createService();

    repository.findAllActive.mockResolvedValue([mockBuilding]);

    await expect(service.getAll()).resolves.toEqual([mockBuilding]);

    expect(repository.findAllActive).toHaveBeenCalledTimes(1);
  });

  it("getById throws 400 when id is empty", async () => {
    const { service, repository } = createService();

    await expect(service.getById("   ")).rejects.toMatchObject({
      statusCode: 400,
      message: "El id del edificio es obligatorio",
    });

    expect(repository.findById).not.toHaveBeenCalled();
  });

  it("getById throws 404 when building does not exist", async () => {
    const { service, repository } = createService();

    repository.findById.mockResolvedValue(null);

    await expect(service.getById("missing")).rejects.toMatchObject({
      statusCode: 404,
      message: "Edificio no encontrado",
    });

    expect(repository.findById).toHaveBeenCalledWith("missing");
  });

  it("getById returns building when it exists", async () => {
    const { service, repository } = createService();

    repository.findById.mockResolvedValue(mockBuilding);

    await expect(service.getById("building-1")).resolves.toEqual(mockBuilding);

    expect(repository.findById).toHaveBeenCalledWith("building-1");
  });

  it("getImagesByBuildingId returns images when building exists", async () => {
    const { service, repository } = createService();

    const images = [
      {
        id: "image-1",
        image_url: "/uploads/buildings/image.jpg",
        image_type: "photo",
        title: "Entrada",
        description: null,
        is_cover: true,
        sort_order: 1,
        is_active: true,
      },
    ];

    repository.findById.mockResolvedValue(mockBuilding);
    repository.findImagesByBuildingId.mockResolvedValue(images);

    await expect(service.getImagesByBuildingId("building-1")).resolves.toEqual(
      images
    );

    expect(repository.findById).toHaveBeenCalledWith("building-1");
    expect(repository.findImagesByBuildingId).toHaveBeenCalledWith("building-1");
  });

  it("create throws 400 when required fields are missing", async () => {
    const { service, repository } = createService();

    await expect(service.create({})).rejects.toMatchObject({
      statusCode: 400,
      message: "El código es obligatorio",
    });

    await expect(
      service.create({
        code: "EDIF-A",
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "El nombre es obligatorio",
    });

    await expect(
      service.create({
        code: "EDIF-A",
        name: "Edificio A",
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "El slug es obligatorio",
    });

    await expect(
      service.create({
        code: "EDIF-A",
        name: "Edificio A",
        slug: "edificio-a",
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "El model_node_name es obligatorio",
    });

    await expect(
      service.create({
        code: "EDIF-A",
        name: "Edificio A",
        slug: "edificio-a",
        model_node_name: "Building_A",
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "El category_code es obligatorio",
    });

    expect(repository.findCategoryIdByCode).not.toHaveBeenCalled();
    expect(repository.createBuilding).not.toHaveBeenCalled();
  });

  it("create throws 400 when category does not exist", async () => {
    const { service, repository } = createService();

    repository.findCategoryIdByCode.mockResolvedValue(null);

    await expect(
      service.create({
        code: "EDIF-A",
        name: "Edificio A",
        slug: "edificio-a",
        model_node_name: "Building_A",
        category_code: "MISSING",
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "La categoría indicada no existe",
    });

    expect(repository.findCategoryIdByCode).toHaveBeenCalledWith("MISSING");
    expect(repository.createBuilding).not.toHaveBeenCalled();
  });

  it("create trims input, creates building and returns created building", async () => {
    const { service, repository } = createService();

    repository.findCategoryIdByCode.mockResolvedValue("category-1");
    repository.createBuilding.mockResolvedValue("building-1");
    repository.findById.mockResolvedValue(mockBuilding);

    const result = await service.create({
      code: " EDIF-A ",
      name: " Edificio A ",
      slug: " edificio-a ",
      model_node_name: " Building_A ",
      category_code: " ACADEMIC ",
    });

    expect(repository.findCategoryIdByCode).toHaveBeenCalledWith("ACADEMIC");
    expect(repository.createBuilding).toHaveBeenCalledWith({
      code: "EDIF-A",
      name: "Edificio A",
      slug: "edificio-a",
      description: null,
      model_node_name: "Building_A",
      x: null,
      y: null,
      z: null,
      latitude: null,
      longitude: null,
      is_active: true,
      is_priority: false,
      category_id: "category-1",
    });
    expect(repository.findById).toHaveBeenCalledWith("building-1");
    expect(result).toEqual(mockBuilding);
  });

  it("update throws 404 when building does not exist", async () => {
    const { service, repository } = createService();

    repository.findById.mockResolvedValue(null);

    await expect(service.update("missing", {})).rejects.toMatchObject({
      statusCode: 404,
      message: "Edificio no encontrado",
    });

    expect(repository.findById).toHaveBeenCalledWith("missing");
  });

  it("updateStatus updates status and returns updated building", async () => {
    const { service, repository } = createService();

    repository.findById.mockResolvedValue(mockBuilding);

    const result = await service.updateStatus("building-1", false);

    expect(repository.updateBuildingStatus).toHaveBeenCalledWith(
      "building-1",
      false
    );
    expect(result).toEqual(mockBuilding);
  });

  it("remove soft deletes building and returns deleted result", async () => {
    const { service, repository } = createService();

    repository.findById.mockResolvedValue(mockBuilding);

    await expect(service.remove("building-1")).resolves.toEqual({
      id: "building-1",
      deleted: true,
    });

    expect(repository.softDeleteBuilding).toHaveBeenCalledWith("building-1");
  });

  it("getCategories delegates to repository.findAllCategories", async () => {
    const { service, repository } = createService();

    const categories = [
      {
        id: "category-1",
        code: "ACADEMIC",
        name: "Académico",
        description: null,
        color_hex: "#2563eb",
        is_active: true,
      },
    ];

    repository.findAllCategories.mockResolvedValue(categories);

    await expect(service.getCategories()).resolves.toEqual(categories);

    expect(repository.findAllCategories).toHaveBeenCalledTimes(1);
  });

  it("throws ApiError instances for service validation errors", async () => {
    const { service } = createService();

    await expect(service.getById("")).rejects.toBeInstanceOf(ApiError);
  });
});