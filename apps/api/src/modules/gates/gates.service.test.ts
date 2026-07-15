import { beforeEach, describe, expect, it, vi } from "vitest";
import { GatesService } from "./gates.service.js";
import { ApiError } from "../../shared/errors/api-error.js";

const mockGate = {
  id: "gate-1",
  name: "Puerta Norte",
  description: "Acceso peatonal principal",
  access_type: "peatonal",
  status: "abierta",
  x: 10,
  y: 0,
  z: 20,
  is_active: true,
  deleted_at: null,
};

function createMockRepository() {
  return {
    findAllActive: vi.fn(),
    findAllForAdmin: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    softDelete: vi.fn(),
  };
}

function createService() {
  const repository = createMockRepository();
  return {
    repository,
    service: new GatesService(repository as any),
  };
}

describe("GatesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("delegates to repository.findAllActive", async () => {
      const { service, repository } = createService();
      repository.findAllActive.mockResolvedValue([mockGate]);

      await expect(service.getAll()).resolves.toEqual([mockGate]);
      expect(repository.findAllActive).toHaveBeenCalledWith();
    });
  });

  describe("getAllForAdmin", () => {
    it("delegates to repository.findAllForAdmin", async () => {
      const { service, repository } = createService();
      const inactiveGate = { ...mockGate, id: "gate-2", is_active: false };
      repository.findAllForAdmin.mockResolvedValue([mockGate, inactiveGate]);

      await expect(service.getAllForAdmin()).resolves.toEqual([mockGate, inactiveGate]);
      expect(repository.findAllForAdmin).toHaveBeenCalledWith();
    });
  });

  describe("getById", () => {
    it("throws 404 when gate does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.getById("missing")).rejects.toMatchObject({
        statusCode: 404,
        message: "Puerta no encontrada",
      });
    });

    it("returns gate when it exists", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockGate);

      await expect(service.getById("gate-1")).resolves.toEqual(mockGate);
    });
  });

  describe("create", () => {
    it("creates gate with defaults and returns created gate", async () => {
      const { service, repository } = createService();
      repository.create.mockResolvedValue("gate-1");
      repository.findById.mockResolvedValue(mockGate);

      const result = await service.create({
        name: "Puerta Norte",
        x: 10,
        z: 20,
      });

      expect(repository.create).toHaveBeenCalledWith({
        name: "Puerta Norte",
        description: null,
        access_type: "peatonal",
        status: "abierta",
        x: 10,
        y: 0,
        z: 20,
        is_active: true,
      });
      expect(result).toEqual(mockGate);
    });

    it("respects explicit values instead of defaults", async () => {
      const { service, repository } = createService();
      repository.create.mockResolvedValue("gate-1");
      repository.findById.mockResolvedValue(mockGate);

      await service.create({
        name: "Puerta Sur",
        description: "Acceso vehicular",
        access_type: "vehicular",
        status: "cerrada",
        x: 5,
        y: 2,
        z: 8,
        is_active: false,
      });

      expect(repository.create).toHaveBeenCalledWith({
        name: "Puerta Sur",
        description: "Acceso vehicular",
        access_type: "vehicular",
        status: "cerrada",
        x: 5,
        y: 2,
        z: 8,
        is_active: false,
      });
    });
  });

  describe("update", () => {
    it("throws 404 when gate does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update("missing", { name: "Nuevo nombre" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Puerta no encontrada",
      });
    });

    it("updates gate and returns updated data", async () => {
      const { service, repository } = createService();
      repository.findById
        .mockResolvedValueOnce(mockGate)
        .mockResolvedValueOnce({ ...mockGate, name: "Actualizado" });
      repository.update.mockResolvedValue(undefined);

      const result = await service.update("gate-1", { name: "Actualizado" });

      expect(repository.update).toHaveBeenCalledWith("gate-1", {
        name: "Actualizado",
        description: mockGate.description,
        access_type: mockGate.access_type,
        status: mockGate.status,
        x: mockGate.x,
        y: mockGate.y,
        z: mockGate.z,
        is_active: true,
      });
      expect(result.name).toBe("Actualizado");
    });
  });

  describe("updateStatus", () => {
    it("throws 404 when gate does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.updateStatus("missing", true)).rejects.toMatchObject({
        statusCode: 404,
        message: "Puerta no encontrada",
      });
    });

    it("updates status and returns updated gate", async () => {
      const { service, repository } = createService();
      repository.findById
        .mockResolvedValueOnce(mockGate)
        .mockResolvedValueOnce({ ...mockGate, is_active: false });
      repository.updateStatus.mockResolvedValue(undefined);

      const result = await service.updateStatus("gate-1", false);

      expect(repository.updateStatus).toHaveBeenCalledWith("gate-1", false);
      expect(result.is_active).toBe(false);
    });
  });

  describe("remove", () => {
    it("throws 404 when gate does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.remove("missing")).rejects.toBeInstanceOf(ApiError);
    });

    it("soft deletes gate and returns deleted result", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockGate);
      repository.softDelete.mockResolvedValue(undefined);

      await expect(service.remove("gate-1")).resolves.toEqual({
        id: "gate-1",
        deleted: true,
      });

      expect(repository.softDelete).toHaveBeenCalledWith("gate-1");
    });
  });
});
