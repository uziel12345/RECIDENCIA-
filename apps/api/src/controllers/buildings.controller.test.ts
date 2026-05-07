import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import {
  getBuildingById,
  getBuildingImages,
  getBuildings,
} from "./buildings.controller.js";
import { pool } from "../db/connection.js";

vi.mock("../db/connection.js", () => ({
  pool: {
    query: vi.fn(),
  },
}));

const mockedPoolQuery = vi.mocked(pool.query);

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
};

const mockImage = {
  id: "image-1",
  image_url: "/uploads/buildings/image.jpg",
  image_type: "photo",
  title: "Entrada",
  description: null,
  is_cover: true,
  sort_order: 1,
  is_active: true,
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

function createMockRequest(data: Partial<Request> = {}): Request {
  return data as unknown as Request;
}

describe("buildings controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("getBuildings returns active buildings", async () => {
    mockedPoolQuery.mockResolvedValueOnce([[mockBuilding], []] as any);

    const req = createMockRequest();
    const res = createMockResponse();

    await getBuildings(req, res);

    expect(mockedPoolQuery).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [mockBuilding],
    });
  });

  it("getBuildings returns 500 when query fails", async () => {
    mockedPoolQuery.mockRejectedValueOnce(new Error("Database error"));

    const req = createMockRequest();
    const res = createMockResponse();

    await getBuildings(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "No se pudieron obtener los edificios",
    });
  });

  it("getBuildingById returns building when it exists", async () => {
    mockedPoolQuery.mockResolvedValueOnce([[mockBuilding], []] as any);

    const req = createMockRequest({
      params: {
        id: "building-1",
      },
    });

    const res = createMockResponse();

    await getBuildingById(req, res);

    expect(mockedPoolQuery).toHaveBeenCalledTimes(1);
    expect(mockedPoolQuery).toHaveBeenCalledWith(
      expect.any(String),
      ["building-1"]
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockBuilding,
    });
  });

  it("getBuildingById returns 404 when building does not exist", async () => {
    mockedPoolQuery.mockResolvedValueOnce([[], []] as any);

    const req = createMockRequest({
      params: {
        id: "missing",
      },
    });

    const res = createMockResponse();

    await getBuildingById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Edificio no encontrado",
    });
  });

  it("getBuildingById returns 500 when query fails", async () => {
    mockedPoolQuery.mockRejectedValueOnce(new Error("Database error"));

    const req = createMockRequest({
      params: {
        id: "building-1",
      },
    });

    const res = createMockResponse();

    await getBuildingById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "No se pudo obtener el edificio",
    });
  });

  it("getBuildingImages returns images for a building", async () => {
    mockedPoolQuery.mockResolvedValueOnce([[mockImage], []] as any);

    const req = createMockRequest({
      params: {
        id: "building-1",
      },
    });

    const res = createMockResponse();

    await getBuildingImages(req, res);

    expect(mockedPoolQuery).toHaveBeenCalledTimes(1);
    expect(mockedPoolQuery).toHaveBeenCalledWith(
      expect.any(String),
      ["building-1"]
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [mockImage],
    });
  });

  it("getBuildingImages returns 500 when query fails", async () => {
    mockedPoolQuery.mockRejectedValueOnce(new Error("Database error"));

    const req = createMockRequest({
      params: {
        id: "building-1",
      },
    });

    const res = createMockResponse();

    await getBuildingImages(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "No se pudieron obtener las imágenes del edificio",
    });
  });
});