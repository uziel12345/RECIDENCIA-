import { beforeEach, describe, expect, it, vi } from "vitest";
import { BuildingImagesRepository } from "./building-images.repository.js";

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

function createMockDb() {
  return {
    query: vi.fn(),
  };
}

function createRepository() {
  const db = createMockDb();

  return {
    db,
    repository: new BuildingImagesRepository(db as any),
  };
}

describe("BuildingImagesRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findByBuildingId returns all images for a building", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[mockImage], []]);

    await expect(repository.findByBuildingId("building-1")).resolves.toEqual([
      mockImage,
    ]);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ["building-1"]);
    expect(db.query.mock.calls[0][0]).toContain("WHERE building_id = ?");
    expect(db.query.mock.calls[0][0]).toContain(
      "ORDER BY is_cover DESC, sort_order ASC, created_at ASC"
    );
  });

  it("findActiveByBuildingId returns only active images for a building", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[mockImage], []]);

    await expect(
      repository.findActiveByBuildingId("building-1")
    ).resolves.toEqual([mockImage]);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ["building-1"]);
    expect(db.query.mock.calls[0][0]).toContain(
      "WHERE building_id = ? AND is_active = TRUE"
    );
  });

  it("findById returns image when found", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[mockImage], []]);

    await expect(repository.findById("image-1")).resolves.toEqual(mockImage);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ["image-1"]);
    expect(db.query.mock.calls[0][0]).toContain("WHERE id = ?");
    expect(db.query.mock.calls[0][0]).toContain("LIMIT 1");
  });

  it("findById returns null when image is not found", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[], []]);

    await expect(repository.findById("missing")).resolves.toBeNull();

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ["missing"]);
  });

  it("clearCoverByBuildingId clears cover images for a building", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[], []]);

    await repository.clearCoverByBuildingId("building-1");

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ["building-1"]);
    expect(db.query.mock.calls[0][0]).toContain("SET is_cover = FALSE");
    expect(db.query.mock.calls[0][0]).toContain("WHERE building_id = ?");
  });

  it("create inserts image and returns generated id", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[], []]);

    const result = await repository.create({
      building_id: "building-1",
      image_url: "/uploads/buildings/image.jpg",
      image_type: "photo",
      title: "Entrada",
      description: "Foto de entrada",
      is_cover: true,
      sort_order: 1,
    });

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][0]).toContain("INSERT INTO building_images");

    const [, params] = db.query.mock.calls[0];

    expect(params).toEqual([
      result,
      "building-1",
      "/uploads/buildings/image.jpg",
      "photo",
      "Entrada",
      "Foto de entrada",
      true,
      1,
    ]);
  });

  it("updateStatus updates image active status", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([[], []]);

    await repository.updateStatus("image-1", false);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), [
      false,
      "image-1",
    ]);
    expect(db.query.mock.calls[0][0]).toContain("SET is_active = ?");
    expect(db.query.mock.calls[0][0]).toContain("WHERE id = ?");
  });

  it("deleteById deletes image and returns true when a row was affected", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);

    await expect(repository.deleteById("image-1")).resolves.toBe(true);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ["image-1"]);
    expect(db.query.mock.calls[0][0]).toContain("DELETE FROM building_images");
    expect(db.query.mock.calls[0][0]).toContain("WHERE id = ?");
  });

  it("deleteById returns false when no row was affected", async () => {
    const { repository, db } = createRepository();

    db.query.mockResolvedValueOnce([{ affectedRows: 0 }, []]);

    await expect(repository.deleteById("missing")).resolves.toBe(false);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ["missing"]);
  });
});