import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../shared/middlewares/error-handler.js";

const searchMock = vi.hoisted(() => vi.fn());

vi.mock("./search.service.js", () => ({
  SearchService: class {
    search = searchMock;
  },
}));

import searchRoutes from "./search.routes.js";

const app = express();
app.use(express.json());
app.use("/api/search", searchRoutes);
app.use(errorHandler);

describe("GET /api/search", () => {
  it("returns normalized, ranked search data", async () => {
    searchMock.mockResolvedValueOnce({
      query: "donde encuentro al director",
      normalizedQuery: "director",
      results: [
        {
          id: "position-director",
          kind: "position",
          title: "Director del Instituto Tecnológico de Oaxaca",
          subtitle: "Cargo institucional · Dirección",
          buildingId: "building-direccion",
          buildingName: "Dirección",
          aliases: ["director"],
          keywords: [],
          score: 100,
        },
      ],
      suggestions: [],
    });

    const response = await request(app)
      .get("/api/search")
      .query({ q: "donde encuentro al director" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      normalizedQuery: "director",
      results: [{ kind: "position", buildingName: "Dirección" }],
    });
    expect(searchMock).toHaveBeenCalledWith("donde encuentro al director", "all");
  });

  it("rejects an empty or oversized query", async () => {
    const empty = await request(app).get("/api/search").query({ q: "" });
    const oversized = await request(app).get("/api/search").query({ q: "x".repeat(121) });
    expect(empty.status).toBe(400);
    expect(oversized.status).toBe(400);
  });
});
