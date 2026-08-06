import { describe, expect, it, vi } from "vitest";
import { CampusCatalogRepository } from "./campus-catalog.repository.js";

function createMockDb() {
  return { query: vi.fn() };
}

function createRepository() {
  const db = createMockDb();
  return { db, repository: new CampusCatalogRepository(db as any) };
}

describe("CampusCatalogRepository", () => {
  describe("findPositionById", () => {
    it("filters directly by id in SQL instead of loading every position", async () => {
      const { db, repository } = createRepository();
      db.query.mockResolvedValueOnce([[{ id: "position-1", title: "Director" }]]);

      const result = await repository.findPositionById("position-1");

      expect(result).toEqual({ id: "position-1", title: "Director" });
      expect(db.query).toHaveBeenCalledTimes(1);
      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toContain("ip.id = ?");
      expect(sql).toContain("LIMIT 1");
      expect(params).toEqual(["position-1"]);
    });

    it("returns null when no row matches", async () => {
      const { db, repository } = createRepository();
      db.query.mockResolvedValueOnce([[]]);

      await expect(repository.findPositionById("missing")).resolves.toBeNull();
    });
  });

  describe("findPositions", () => {
    it("adds a building filter clause only when a building id is provided", async () => {
      const { db, repository } = createRepository();
      db.query.mockResolvedValueOnce([[]]);
      await repository.findPositions("building-1");
      const [sqlWithFilter, paramsWithFilter] = db.query.mock.calls[0];
      expect(sqlWithFilter).toContain("ip.building_id = ?");
      expect(paramsWithFilter).toEqual(["building-1"]);

      db.query.mockResolvedValueOnce([[]]);
      await repository.findPositions();
      const [sqlWithoutFilter, paramsWithoutFilter] = db.query.mock.calls[1];
      expect(sqlWithoutFilter).not.toContain("ip.building_id = ?");
      expect(paramsWithoutFilter).toEqual([]);
    });
  });

  describe("findStreets", () => {
    it("only returns active streets ordered by display order", async () => {
      const { db, repository } = createRepository();
      db.query.mockResolvedValueOnce([[]]);
      await repository.findStreets();
      const [sql] = db.query.mock.calls[0];
      expect(sql).toContain("cs.is_active = TRUE");
      expect(sql).toContain("ORDER BY cs.display_order ASC");
    });
  });

  describe("findQuickQueries", () => {
    it("only returns active quick queries ordered by priority", async () => {
      const { db, repository } = createRepository();
      db.query.mockResolvedValueOnce([[]]);
      await repository.findQuickQueries();
      const [sql] = db.query.mock.calls[0];
      expect(sql).toContain("is_active = TRUE");
      expect(sql).toContain("ORDER BY priority DESC");
    });
  });
});
