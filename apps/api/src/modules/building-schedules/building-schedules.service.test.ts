import { beforeEach, describe, expect, it, vi } from "vitest";
import { BuildingSchedulesService } from "./building-schedules.service.js";
import { ApiError } from "../../shared/errors/api-error.js";

const mockSchedule = {
  id: "schedule-1",
  building_id: "building-1",
  building_code: "DIR",
  building_name: "Dirección",
  day_of_week: 1,
  open_time: "08:00:00",
  close_time: "15:00:00",
  is_active: true,
  deleted_at: null,
};

function createMockRepository() {
  return {
    findAllActive: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    softDelete: vi.fn(),
    buildingExists: vi.fn(),
  };
}

function createService() {
  const repository = createMockRepository();
  return {
    repository,
    service: new BuildingSchedulesService(repository as any),
  };
}

describe("BuildingSchedulesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("passes buildingId filter to repository", async () => {
      const { service, repository } = createService();
      repository.findAllActive.mockResolvedValue([mockSchedule]);

      await expect(service.getAll("building-1")).resolves.toEqual([mockSchedule]);
      expect(repository.findAllActive).toHaveBeenCalledWith("building-1");
    });
  });

  describe("getById", () => {
    it("throws 404 when schedule does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.getById("missing")).rejects.toMatchObject({
        statusCode: 404,
        message: "Horario no encontrado",
      });
    });
  });

  describe("create", () => {
    it("throws 404 when building does not exist", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(false);

      await expect(
        service.create({
          building_id: "building-x",
          day_of_week: 1,
          open_time: "08:00",
          close_time: "15:00",
        })
      ).rejects.toMatchObject({ statusCode: 404, message: "El edificio indicado no existe" });
    });

    it("throws 400 when open_time is not before close_time", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);

      await expect(
        service.create({
          building_id: "building-1",
          day_of_week: 1,
          open_time: "15:00",
          close_time: "08:00",
        })
      ).rejects.toMatchObject({ statusCode: 400 });

      expect(repository.create).not.toHaveBeenCalled();
    });

    it("throws 400 when open_time equals close_time", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);

      await expect(
        service.create({
          building_id: "building-1",
          day_of_week: 1,
          open_time: "08:00",
          close_time: "08:00",
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("creates schedule with defaults and returns created schedule", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.create.mockResolvedValue("schedule-1");
      repository.findById.mockResolvedValue(mockSchedule);

      const result = await service.create({
        building_id: "building-1",
        day_of_week: 1,
        open_time: "08:00",
        close_time: "15:00",
      });

      expect(repository.create).toHaveBeenCalledWith({
        building_id: "building-1",
        day_of_week: 1,
        open_time: "08:00",
        close_time: "15:00",
        is_active: true,
      });
      expect(result).toEqual(mockSchedule);
    });
  });

  describe("update", () => {
    it("throws 404 when schedule does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update("missing", { close_time: "16:00" })
      ).rejects.toMatchObject({ statusCode: 404, message: "Horario no encontrado" });
    });

    it("re-validates open/close using merged values", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockSchedule);

      await expect(
        service.update("schedule-1", { open_time: "16:00" })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("updates schedule and returns updated data", async () => {
      const { service, repository } = createService();
      repository.findById
        .mockResolvedValueOnce(mockSchedule)
        .mockResolvedValueOnce({ ...mockSchedule, close_time: "16:00:00" });
      repository.update.mockResolvedValue(undefined);

      const result = await service.update("schedule-1", { close_time: "16:00" });

      expect(repository.update).toHaveBeenCalledWith("schedule-1", {
        building_id: mockSchedule.building_id,
        day_of_week: mockSchedule.day_of_week,
        open_time: mockSchedule.open_time,
        close_time: "16:00",
        is_active: true,
      });
      expect(result.close_time).toBe("16:00:00");
    });
  });

  describe("remove", () => {
    it("throws 404 when schedule does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.remove("missing")).rejects.toBeInstanceOf(ApiError);
    });

    it("soft deletes schedule and returns deleted result", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockSchedule);
      repository.softDelete.mockResolvedValue(undefined);

      await expect(service.remove("schedule-1")).resolves.toEqual({
        id: "schedule-1",
        deleted: true,
      });
    });
  });
});
