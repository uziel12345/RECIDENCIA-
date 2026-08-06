import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../shared/middlewares/error-handler.js";
import { ApiError } from "../../shared/errors/api-error.js";

const getStreets = vi.hoisted(() => vi.fn());
const getQuickQueries = vi.hoisted(() => vi.fn());
const getPositions = vi.hoisted(() => vi.fn());
const getPosition = vi.hoisted(() => vi.fn());

vi.mock("./campus-catalog.service.js", () => ({
  CampusCatalogService: class {
    getStreets = getStreets;
    getQuickQueries = getQuickQueries;
    getPositions = getPositions;
    getPosition = getPosition;
  },
}));

import campusCatalogRoutes from "./campus-catalog.routes.js";

const app = express();
app.use(express.json());
app.use("/api", campusCatalogRoutes);
app.use(errorHandler);

const VALID_ID = "82000000-0000-4000-8000-000000000001";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/streets", () => {
  it("returns the visible campus streets", async () => {
    getStreets.mockResolvedValueOnce([
      { id: "street-1", name: "Avenida Constituyentes", aliases: [], position: { x: 1, y: 2, z: 3 }, rotation: 0, description: null, isVisible: true },
    ]);
    const response = await request(app).get("/api/streets");
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("Avenida Constituyentes");
  });
});

describe("GET /api/quick-queries", () => {
  it("returns the active quick queries", async () => {
    getQuickQueries.mockResolvedValueOnce([
      { id: "quick-1", label: "¿Dónde está el director?", query: "director", category: "position", icon: null, priority: 100 },
    ]);
    const response = await request(app).get("/api/quick-queries");
    expect(response.status).toBe(200);
    expect(response.body.data[0].label).toBe("¿Dónde está el director?");
  });
});

describe("GET /api/positions", () => {
  it("returns all public institutional positions", async () => {
    getPositions.mockResolvedValueOnce([]);
    const response = await request(app).get("/api/positions");
    expect(response.status).toBe(200);
    expect(getPositions).toHaveBeenCalledWith();
  });
});

describe("GET /api/positions/:id", () => {
  it("returns the position when the id is a valid UUID", async () => {
    getPosition.mockResolvedValueOnce({
      id: VALID_ID,
      title: "Director del Instituto Tecnológico de Oaxaca",
      aliases: [],
      personName: null,
      departmentId: null,
      departmentName: null,
      buildingId: "building-direccion",
      buildingName: "DIRECCIÓN",
      officeName: null,
      isPublic: true,
      isActive: true,
      searchKeywords: [],
    });
    const response = await request(app).get(`/api/positions/${VALID_ID}`);
    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe("Director del Instituto Tecnológico de Oaxaca");
  });

  it("rejects a non-UUID id before reaching the service", async () => {
    const response = await request(app).get("/api/positions/not-a-uuid");
    expect(response.status).toBe(400);
    expect(getPosition).not.toHaveBeenCalled();
  });

  it("propagates a 404 when the position does not exist", async () => {
    getPosition.mockRejectedValueOnce(new ApiError(404, "Cargo institucional no encontrado"));
    const response = await request(app).get(`/api/positions/${VALID_ID}`);
    expect(response.status).toBe(404);
  });
});

describe("GET /api/buildings/:id/positions", () => {
  it("filters positions by building id", async () => {
    getPositions.mockResolvedValueOnce([]);
    const response = await request(app).get(`/api/buildings/${VALID_ID}/positions`);
    expect(response.status).toBe(200);
    expect(getPositions).toHaveBeenCalledWith(VALID_ID);
  });

  it("rejects a non-UUID building id", async () => {
    const response = await request(app).get("/api/buildings/not-a-uuid/positions");
    expect(response.status).toBe(400);
  });
});
