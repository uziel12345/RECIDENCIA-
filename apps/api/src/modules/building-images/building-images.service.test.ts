import { beforeEach, describe, expect, it, vi } from "vitest";
import { BuildingImagesService } from "./building-images.service.js";
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

const mockImage = {
  id: "image-1",
  building_id: "building-1",
  image_url: "/uploads/buildings/image.jpg",
  image_type: "photo",
  title: "Entrada",
  description: null,
  is_cover: true,
  sort_order: 1,
  is_active: true,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
};

function createMockImageRepository() {
  return {
    findByBuildingId: vi.fn(),
    findActiveByBuildingId: vi.fn(),
    findById: vi.fn(),
    clearCoverByBuildingId: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    deleteById: vi.fn(),
  };
}

function createMockBuildingsRepository() {
  return {
    findById: vi.fn(),
  };
}

function createService() {
  const imageRepository = createMockImageRepository();
  const buildingsRepository = createMockBuildingsRepository();

  return {
    imageRepository,
    buildingsRepository,
    service: new BuildingImagesService(
      imageRepository as any,
      buildingsRepository as any
    ),
  };
}

describe("BuildingImagesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getImagesForBuilding throws 400 when building id is empty", async () => {
    const { service, buildingsRepository, imageRepository } = createService();

    await expect(service.getImagesForBuilding("")).rejects.toMatchObject({
      statusCode: 400,
      message: "El id del edificio es obligatorio",
    });

    expect(buildingsRepository.findById).not.toHaveBeenCalled();
    expect(imageRepository.findActiveByBuildingId).not.toHaveBeenCalled();
  });

  it("getImagesForBuilding throws 404 when building does not exist", async () => {
    const { service, buildingsRepository, imageRepository } = createService();

    buildingsRepository.findById.mockResolvedValue(null);

    await expect(service.getImagesForBuilding("missing")).rejects.toMatchObject({
      statusCode: 404,
      message: "Edificio no encontrado",
    });

    expect(buildingsRepository.findById).toHaveBeenCalledWith("missing");
    expect(imageRepository.findActiveByBuildingId).not.toHaveBeenCalled();
  });

  it("getImagesForBuilding returns active images by default", async () => {
    const { service, buildingsRepository, imageRepository } = createService();

    buildingsRepository.findById.mockResolvedValue(mockBuilding);
    imageRepository.findActiveByBuildingId.mockResolvedValue([mockImage]);

    await expect(service.getImagesForBuilding("building-1")).resolves.toEqual([
      mockImage,
    ]);

    expect(imageRepository.findActiveByBuildingId).toHaveBeenCalledWith(
      "building-1"
    );
    expect(imageRepository.findByBuildingId).not.toHaveBeenCalled();
  });

  it("getImagesForBuilding returns all images when includeInactive is true", async () => {
    const { service, buildingsRepository, imageRepository } = createService();

    buildingsRepository.findById.mockResolvedValue(mockBuilding);
    imageRepository.findByBuildingId.mockResolvedValue([mockImage]);

    await expect(
      service.getImagesForBuilding("building-1", true)
    ).resolves.toEqual([mockImage]);

    expect(imageRepository.findByBuildingId).toHaveBeenCalledWith("building-1");
    expect(imageRepository.findActiveByBuildingId).not.toHaveBeenCalled();
  });

  it("createImage throws 400 when file is missing", async () => {
    const { service, buildingsRepository, imageRepository } = createService();

    buildingsRepository.findById.mockResolvedValue(mockBuilding);

    await expect(
      service.createImage({
        buildingId: "building-1",
        file: undefined,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "La imagen es obligatoria",
    });

    expect(imageRepository.create).not.toHaveBeenCalled();
  });

  it("createImage clears previous cover when image is cover", async () => {
    const { service, buildingsRepository, imageRepository } = createService();

    buildingsRepository.findById.mockResolvedValue(mockBuilding);
    imageRepository.create.mockResolvedValue("image-1");
    imageRepository.findById.mockResolvedValue(mockImage);

    const result = await service.createImage({
      buildingId: "building-1",
      file: {
        filename: "image.jpg",
      },
      title: " Entrada ",
      description: " Foto principal ",
      image_type: " photo ",
      is_cover: "true",
      sort_order: "5",
    });

    expect(imageRepository.clearCoverByBuildingId).toHaveBeenCalledWith(
      "building-1"
    );

    expect(imageRepository.create).toHaveBeenCalledWith({
      building_id: "building-1",
      image_url: "/uploads/buildings/image.jpg",
      image_type: "photo",
      title: "Entrada",
      description: "Foto principal",
      is_cover: true,
      sort_order: 5,
    });

    expect(result).toEqual(mockImage);
  });

  it("createImage uses default values when optional fields are missing", async () => {
    const { service, buildingsRepository, imageRepository } = createService();

    buildingsRepository.findById.mockResolvedValue(mockBuilding);
    imageRepository.create.mockResolvedValue("image-1");
    imageRepository.findById.mockResolvedValue({
      ...mockImage,
      image_type: "general",
      title: null,
      description: null,
      is_cover: false,
      sort_order: 0,
    });

    const result = await service.createImage({
      buildingId: "building-1",
      file: {
        filename: "image.jpg",
      },
    });

    expect(imageRepository.clearCoverByBuildingId).not.toHaveBeenCalled();
    expect(imageRepository.create).toHaveBeenCalledWith({
      building_id: "building-1",
      image_url: "/uploads/buildings/image.jpg",
      image_type: "general",
      title: null,
      description: null,
      is_cover: false,
      sort_order: 0,
    });
    expect(result.image_type).toBe("general");
  });

  it("createImage throws 500 when created image cannot be retrieved", async () => {
    const { service, buildingsRepository, imageRepository } = createService();

    buildingsRepository.findById.mockResolvedValue(mockBuilding);
    imageRepository.create.mockResolvedValue("image-1");
    imageRepository.findById.mockResolvedValue(null);

    await expect(
      service.createImage({
        buildingId: "building-1",
        file: {
          filename: "image.jpg",
        },
      })
    ).rejects.toMatchObject({
      statusCode: 500,
      message: "No se pudo recuperar la imagen creada",
    });
  });

  it("updateImageStatus throws 404 when image does not exist", async () => {
    const { service, imageRepository } = createService();

    imageRepository.findById.mockResolvedValue(null);

    await expect(
      service.updateImageStatus("missing", true)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Imagen no encontrada",
    });

    expect(imageRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("updateImageStatus updates image status and returns updated image", async () => {
    const { service, imageRepository } = createService();

    imageRepository.findById
      .mockResolvedValueOnce(mockImage)
      .mockResolvedValueOnce({
        ...mockImage,
        is_active: false,
      });

    const result = await service.updateImageStatus("image-1", false);

    expect(imageRepository.updateStatus).toHaveBeenCalledWith(
      "image-1",
      false
    );
    expect(result.is_active).toBe(false);
  });

  it("updateImageStatus throws 500 when updated image cannot be retrieved", async () => {
    const { service, imageRepository } = createService();

    imageRepository.findById
      .mockResolvedValueOnce(mockImage)
      .mockResolvedValueOnce(null);

    await expect(
      service.updateImageStatus("image-1", false)
    ).rejects.toMatchObject({
      statusCode: 500,
      message: "No se pudo recuperar la imagen actualizada",
    });
  });

  it("removeImage throws 404 when image does not exist", async () => {
    const { service, imageRepository } = createService();

    imageRepository.findById.mockResolvedValue(null);

    await expect(service.removeImage("missing")).rejects.toMatchObject({
      statusCode: 404,
      message: "Imagen no encontrada",
    });

    expect(imageRepository.deleteById).not.toHaveBeenCalled();
  });

  it("removeImage deletes image and returns deleted result", async () => {
    const { service, imageRepository } = createService();

    imageRepository.findById.mockResolvedValue({
      ...mockImage,
      image_url: "/external/image.jpg",
    });
    imageRepository.deleteById.mockResolvedValue(true);

    await expect(service.removeImage("image-1")).resolves.toEqual({
      id: "image-1",
      deleted: true,
    });

    expect(imageRepository.deleteById).toHaveBeenCalledWith("image-1");
  });

  it("throws ApiError instances for validation errors", async () => {
    const { service } = createService();

    await expect(service.getImagesForBuilding("")).rejects.toBeInstanceOf(
      ApiError
    );
  });
});