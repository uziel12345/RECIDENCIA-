import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClassroomsService } from "./classrooms.service.js";
import { ApiError } from "../../shared/errors/api-error.js";

const mockClassroom = {
  id: "classroom-1",
  building_id: "building-1",
  building_code: "DIR",
  building_name: "Dirección",
  code: "A-101",
  name: "Aula 101",
  description: null,
  floor: 1,
  capacity: 30,
  type: "aula" as const,
  is_active: true,
  deleted_at: null,
};

function createMockRepository() {
  return {
    findAllActive: vi.fn(),
    findById: vi.fn(),
    findByBuildingAndCode: vi.fn(),
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
    service: new ClassroomsService(repository as any),
  };
}

describe("ClassroomsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("delegates to repository.findAllActive without filter", async () => {
      const { service, repository } = createService();
      repository.findAllActive.mockResolvedValue([mockClassroom]);

      await expect(service.getAll()).resolves.toEqual([mockClassroom]);
      expect(repository.findAllActive).toHaveBeenCalledWith(undefined);
    });

    it("passes buildingId filter to repository", async () => {
      const { service, repository } = createService();
      repository.findAllActive.mockResolvedValue([mockClassroom]);

      await expect(service.getAll("building-1")).resolves.toEqual([mockClassroom]);
      expect(repository.findAllActive).toHaveBeenCalledWith("building-1");
    });
  });

  describe("getById", () => {
    it("throws 404 when classroom does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.getById("missing")).rejects.toMatchObject({
        statusCode: 404,
        message: "Aula no encontrada",
      });
    });

    it("returns classroom when it exists", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockClassroom);

      await expect(service.getById("classroom-1")).resolves.toEqual(mockClassroom);
      expect(repository.findById).toHaveBeenCalledWith("classroom-1");
    });
  });

  describe("create", () => {
    it("throws 404 when building does not exist", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(false);

      await expect(
        service.create({
          building_id: "building-x",
          code: "A-101",
          name: "Aula 101",
        })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "El edificio indicado no existe",
      });

      expect(repository.findByBuildingAndCode).not.toHaveBeenCalled();
    });

    it("throws 409 when code already exists in that building", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.findByBuildingAndCode.mockResolvedValue(mockClassroom);

      await expect(
        service.create({ building_id: "building-1", code: "A-101", name: "Aula 101" })
      ).rejects.toMatchObject({
        statusCode: 409,
      });

      expect(repository.create).not.toHaveBeenCalled();
    });

    it("creates classroom with defaults and returns created classroom", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.findByBuildingAndCode.mockResolvedValue(null);
      repository.create.mockResolvedValue("classroom-1");
      repository.findById.mockResolvedValue(mockClassroom);

      const result = await service.create({
        building_id: "building-1",
        code: "A-101",
        name: "Aula 101",
      });

      expect(repository.create).toHaveBeenCalledWith({
        building_id: "building-1",
        code: "A-101",
        name: "Aula 101",
        description: null,
        floor: 0,
        capacity: null,
        type: "aula",
        is_active: true,
      });
      expect(result).toEqual(mockClassroom);
    });

    it("creates classroom with all explicit fields", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.findByBuildingAndCode.mockResolvedValue(null);
      repository.create.mockResolvedValue("classroom-1");
      repository.findById.mockResolvedValue(mockClassroom);

      await service.create({
        building_id: "building-1",
        code: "LAB-1",
        name: "Laboratorio 1",
        floor: 2,
        capacity: 20,
        type: "laboratorio",
        is_active: false,
      });

      expect(repository.create).toHaveBeenCalledWith({
        building_id: "building-1",
        code: "LAB-1",
        name: "Laboratorio 1",
        description: null,
        floor: 2,
        capacity: 20,
        type: "laboratorio",
        is_active: false,
      });
    });
  });

  describe("update", () => {
    it("throws 404 when classroom does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update("missing", { name: "Nuevo nombre" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Aula no encontrada",
      });
    });

    it("throws 404 when new building_id does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockClassroom);
      repository.buildingExists.mockResolvedValue(false);

      await expect(
        service.update("classroom-1", { building_id: "building-x" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "El edificio indicado no existe",
      });
    });

    it("throws 409 on code conflict with another classroom", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockClassroom);
      repository.findByBuildingAndCode.mockResolvedValue({
        ...mockClassroom,
        id: "classroom-2",
      });

      await expect(
        service.update("classroom-1", { code: "A-101" })
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(repository.update).not.toHaveBeenCalled();
    });

    it("updates classroom and returns updated data", async () => {
      const { service, repository } = createService();
      repository.findById
        .mockResolvedValueOnce(mockClassroom)
        .mockResolvedValueOnce({ ...mockClassroom, name: "Aula Actualizada" });
      repository.findByBuildingAndCode.mockResolvedValue(null);
      repository.update.mockResolvedValue(undefined);

      const result = await service.update("classroom-1", { name: "Aula Actualizada" });

      expect(repository.update).toHaveBeenCalledWith("classroom-1", {
        building_id: mockClassroom.building_id,
        code: mockClassroom.code,
        name: "Aula Actualizada",
        description: mockClassroom.description,
        floor: mockClassroom.floor,
        capacity: mockClassroom.capacity,
        type: mockClassroom.type,
        is_active: true,
      });
      expect(result.name).toBe("Aula Actualizada");
    });
  });

  describe("updateStatus", () => {
    it("throws 404 when classroom does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.updateStatus("missing", true)).rejects.toMatchObject({
        statusCode: 404,
        message: "Aula no encontrada",
      });
    });

    it("updates status and returns updated classroom", async () => {
      const { service, repository } = createService();
      repository.findById
        .mockResolvedValueOnce(mockClassroom)
        .mockResolvedValueOnce({ ...mockClassroom, is_active: false });
      repository.updateStatus.mockResolvedValue(undefined);

      const result = await service.updateStatus("classroom-1", false);

      expect(repository.updateStatus).toHaveBeenCalledWith("classroom-1", false);
      expect(result.is_active).toBe(false);
    });
  });

  describe("remove", () => {
    it("throws 404 when classroom does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.remove("missing")).rejects.toMatchObject({
        statusCode: 404,
        message: "Aula no encontrada",
      });
    });

    it("soft deletes classroom and returns deleted result", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockClassroom);
      repository.softDelete.mockResolvedValue(undefined);

      await expect(service.remove("classroom-1")).resolves.toEqual({
        id: "classroom-1",
        deleted: true,
      });

      expect(repository.softDelete).toHaveBeenCalledWith("classroom-1");
    });

    it("throws ApiError instances for domain errors", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.remove("missing")).rejects.toBeInstanceOf(ApiError);
    });
  });
});
