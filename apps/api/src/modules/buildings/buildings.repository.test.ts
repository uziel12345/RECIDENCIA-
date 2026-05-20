import { beforeEach, describe, expect, it, vi } from "vitest";
import { BuildingsRepository } from "./buildings.repository.js";

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
  image_url: "/uploads/buildings/image.jpg",
  image_type: "photo",
  title: "Entrada",
  description: null,
  is_cover: true,
  sort_order: 1,
  is_active: true,
};

function createMockDb() {
  return {
    query: vi.fn(),
  };
}

function createRepository() {
  const db = createMockDb();

  return {
    db,
    repository: new BuildingsRepository(db as any),
  };
}

describe("BuildingsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findAllActive returns active buildings", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[mockBuilding], []]);

    await expect(repository.findAllActive()).resolves.toEqual([mockBuilding]);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining("WHERE b.is_active = TRUE"));
  });

  it("countForAdmin returns total buildings count", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[{ total: 7 }], []]);

    await expect(repository.countForAdmin()).resolves.toBe(7);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT COUNT(*) AS total FROM buildings")
    );
  });

  it("countForAdmin returns zero when total is missing", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[{}], []]);

    await expect(repository.countForAdmin()).resolves.toBe(0);
  });

  it("findAllForAdminPaginated returns rows and total", async () => {
    const { repository, db } = createRepository();

    db.query
      .mockResolvedValueOnce([[mockBuilding], []])
      .mockResolvedValueOnce([[{ total: 1 }], []]);

    await expect(repository.findAllForAdminPaginated(2, 10)).resolves.toEqual({
      rows: [mockBuilding],
      total: 1,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("LIMIT ? OFFSET ?"),
      [10, 10]
    );
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  it("findAllForAdminPaginated never uses negative offset", async () => {
    const { repository, db } = createRepository();

    db.query
      .mockResolvedValueOnce([[mockBuilding], []])
      .mockResolvedValueOnce([[{ total: 1 }], []]);

    await repository.findAllForAdminPaginated(0, 10);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("LIMIT ? OFFSET ?"),
      [10, 0]
    );
  });

  it("findAllForAdmin returns all admin buildings", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[mockBuilding], []]);

    await expect(repository.findAllForAdmin()).resolves.toEqual([mockBuilding]);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("ORDER BY b.is_active DESC, b.name ASC")
    );
  });

  it("findById returns building when found", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[mockBuilding], []]);

    await expect(repository.findById("building-1")).resolves.toEqual(mockBuilding);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ["building-1"]);
  });

  it("findById returns null when building is not found", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[], []]);

    await expect(repository.findById("missing")).resolves.toBeNull();

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ["missing"]);
  });

  it("findImagesByBuildingId returns active images", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[mockImage], []]);

    await expect(repository.findImagesByBuildingId("building-1")).resolves.toEqual([
      mockImage,
    ]);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ["building-1"]);
  });

  it("findCategoryIdByCode returns category id when found", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[{ id: "category-1" }], []]);

    await expect(repository.findCategoryIdByCode("ACADEMIC")).resolves.toBe(
      "category-1"
    );

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ["ACADEMIC"]);
  });

  it("findCategoryIdByCode returns null when category is not found", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[], []]);

    await expect(repository.findCategoryIdByCode("MISSING")).resolves.toBeNull();
  });

  it("createBuilding inserts building and returns generated id", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[], []]);

    const result = await repository.createBuilding({
      code: "EDIF-A",
      name: "Edificio A",
      slug: "edificio-a",
      description: null,
      model_node_name: "Building_A",
      x: 1,
      y: 2,
      z: 3,
      latitude: 17.073,
      longitude: -96.726,
      is_active: true,
      is_priority: false,
      category_id: "category-1",
    });

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);

    expect(db.query).toHaveBeenCalledTimes(1);

    const [, params] = db.query.mock.calls[0];

    expect(params).toEqual([
      result,
      "category-1",
      "EDIF-A",
      "Edificio A",
      "edificio-a",
      null,
      "Building_A",
      1,
      2,
      3,
      17.073,
      -96.726,
      true,
      false,
    ]);
  });

  it("updateBuilding updates building by id", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[], []]);

    await repository.updateBuilding("building-1", {
      code: "EDIF-A",
      name: "Edificio A",
      slug: "edificio-a",
      description: "Actualizado",
      model_node_name: "Building_A",
      x: 1,
      y: 2,
      z: 3,
      latitude: 17.073,
      longitude: -96.726,
      is_active: true,
      is_priority: false,
      category_id: "category-1",
    });

    expect(db.query).toHaveBeenCalledWith(expect.any(String), [
      "category-1",
      "EDIF-A",
      "Edificio A",
      "edificio-a",
      "Actualizado",
      "Building_A",
      1,
      2,
      3,
      17.073,
      -96.726,
      true,
      false,
      "building-1",
    ]);
  });

  it("updateBuildingStatus updates active status", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[], []]);

    await repository.updateBuildingStatus("building-1", false);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), [
      false,
      false,
      "building-1",
    ]);
  });

  it("softDeleteBuilding disables building", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[], []]);

    await repository.softDeleteBuilding("building-1");

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ["building-1"]);
    expect(db.query.mock.calls[0][0]).toContain("SET is_active = FALSE");
    expect(db.query.mock.calls[0][0]).toContain("deleted_at = NOW()");
  });

  it("findAllCategories returns categories", async () => {
    const { repository, db } = createRepository();

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

    db.query.mockResolvedValueOnce([categories, []]);

    await expect(repository.findAllCategories()).resolves.toEqual(categories);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("FROM building_categories")
    );
  });
});