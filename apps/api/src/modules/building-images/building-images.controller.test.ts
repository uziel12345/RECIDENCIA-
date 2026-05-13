import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import {
  deleteBuildingImage,
  getBuildingImagesForAdmin,
  updateBuildingImageStatus,
  uploadBuildingImage,
} from "./building-images.controller.js";

const serviceMock = vi.hoisted(() => ({
  getImagesForBuilding: vi.fn(),
  createImage: vi.fn(),
  updateImageStatus: vi.fn(),
  removeImage: vi.fn(),
}));

vi.mock("./building-images.service.js", () => ({
  BuildingImagesService: vi.fn(function MockBuildingImagesService() {
    return serviceMock;
  }),
}));

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

type MockRequestWithFile = Partial<Request> & {
  file?: {
    filename: string;
  };
};

function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

function createMockRequest(data: MockRequestWithFile = {}): Request {
  return data as unknown as Request;
}

function createMockNext() {
  return vi.fn() as unknown as NextFunction;
}

describe("building-images controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getBuildingImagesForAdmin returns active images by default", async () => {
    serviceMock.getImagesForBuilding.mockResolvedValue([mockImage]);

    const req = createMockRequest({
      params: {
        buildingId: "building-1",
      },
      query: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    getBuildingImagesForAdmin(req, res, next);

    await vi.waitFor(() => {
      expect(serviceMock.getImagesForBuilding).toHaveBeenCalledWith(
        "building-1",
        false
      );
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: undefined,
      data: [mockImage],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("getBuildingImagesForAdmin supports includeInactive query", async () => {
    serviceMock.getImagesForBuilding.mockResolvedValue([mockImage]);

    const req = createMockRequest({
      params: {
        buildingId: "building-1",
      },
      query: {
        includeInactive: "true",
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    getBuildingImagesForAdmin(req, res, next);

    await vi.waitFor(() => {
      expect(serviceMock.getImagesForBuilding).toHaveBeenCalledWith(
        "building-1",
        true
      );
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: undefined,
      data: [mockImage],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("uploadBuildingImage creates image and returns 201", async () => {
    serviceMock.createImage.mockResolvedValue(mockImage);

    const req = createMockRequest({
      params: {
        buildingId: "building-1",
      },
      body: {
        title: "Entrada",
        description: "Foto principal",
        image_type: "photo",
        is_cover: "true",
        sort_order: "1",
      },
      file: {
        filename: "image.jpg",
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    uploadBuildingImage(req, res, next);

    await vi.waitFor(() => {
      expect(serviceMock.createImage).toHaveBeenCalledWith({
        buildingId: "building-1",
        file: {
          filename: "image.jpg",
        },
        title: "Entrada",
        description: "Foto principal",
        image_type: "photo",
        is_cover: "true",
        sort_order: "1",
      });
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Imagen subida correctamente",
      data: mockImage,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("updateBuildingImageStatus updates image status and returns activation message", async () => {
    serviceMock.updateImageStatus.mockResolvedValue({
      ...mockImage,
      is_active: true,
    });

    const req = createMockRequest({
      params: {
        imageId: "image-1",
      },
      body: {
        is_active: "true",
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    updateBuildingImageStatus(req, res, next);

    await vi.waitFor(() => {
      expect(serviceMock.updateImageStatus).toHaveBeenCalledWith(
        "image-1",
        true
      );
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Imagen activada correctamente",
      data: {
        ...mockImage,
        is_active: true,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("updateBuildingImageStatus returns deactivation message", async () => {
    serviceMock.updateImageStatus.mockResolvedValue({
      ...mockImage,
      is_active: false,
    });

    const req = createMockRequest({
      params: {
        imageId: "image-1",
      },
      body: {
        is_active: "false",
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    updateBuildingImageStatus(req, res, next);

    await vi.waitFor(() => {
      expect(serviceMock.updateImageStatus).toHaveBeenCalledWith(
        "image-1",
        false
      );
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Imagen desactivada correctamente",
      data: {
        ...mockImage,
        is_active: false,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("deleteBuildingImage deletes image", async () => {
    serviceMock.removeImage.mockResolvedValue({
      id: "image-1",
      deleted: true,
    });

    const req = createMockRequest({
      params: {
        imageId: "image-1",
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    deleteBuildingImage(req, res, next);

    await vi.waitFor(() => {
      expect(serviceMock.removeImage).toHaveBeenCalledWith("image-1");
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Imagen eliminada correctamente",
      data: {
        id: "image-1",
        deleted: true,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("passes service errors to next", async () => {
    const error = new Error("Service error");

    serviceMock.getImagesForBuilding.mockRejectedValue(error);

    const req = createMockRequest({
      params: {
        buildingId: "building-1",
      },
      query: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    getBuildingImagesForAdmin(req, res, next);

    await vi.waitFor(() => {
      expect(next).toHaveBeenCalledWith(error);
    });

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});