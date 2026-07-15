import { beforeEach, describe, expect, it, vi } from "vitest";
import { DepartmentsService } from "./departments.service.js";
import { ApiError } from "../../shared/errors/api-error.js";

const mockDepartment = {
  id: "department-1",
  building_id: "building-1",
  building_code: "DIR",
  building_name: "Dirección",
  name: "Departamento de Sistemas",
  description: "Coordina la carrera de Ing. en Sistemas",
  schedule_text: "Lunes a viernes 8:00-15:00",
  head_name: "Ing. Juan Pérez",
  contact: "sistemas@itoaxaca.edu.mx",
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
    service: new DepartmentsService(repository as any),
  };
}

describe("DepartmentsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("delegates to repository.findAllActive without filter", async () => {
      const { service, repository } = createService();
      repository.findAllActive.mockResolvedValue([mockDepartment]);

      await expect(service.getAll()).resolves.toEqual([mockDepartment]);
      expect(repository.findAllActive).toHaveBeenCalledWith(undefined);
    });

    it("passes buildingId filter to repository", async () => {
      const { service, repository } = createService();
      repository.findAllActive.mockResolvedValue([mockDepartment]);

      await expect(service.getAll("building-1")).resolves.toEqual([mockDepartment]);
      expect(repository.findAllActive).toHaveBeenCalledWith("building-1");
    });
  });

  describe("getById", () => {
    it("throws 404 when department does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.getById("missing")).rejects.toMatchObject({
        statusCode: 404,
        message: "Departamento no encontrado",
      });
    });

    it("returns department when it exists", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockDepartment);

      await expect(service.getById("department-1")).resolves.toEqual(mockDepartment);
    });
  });

  describe("create", () => {
    it("throws 404 when building does not exist", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(false);

      await expect(
        service.create({ building_id: "building-x", name: "Departamento" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "El edificio indicado no existe",
      });

      expect(repository.create).not.toHaveBeenCalled();
    });

    it("creates department with defaults and returns created department", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.create.mockResolvedValue("department-1");
      repository.findById.mockResolvedValue(mockDepartment);

      const result = await service.create({
        building_id: "building-1",
        name: "Departamento de Sistemas",
      });

      expect(repository.create).toHaveBeenCalledWith({
        building_id: "building-1",
        name: "Departamento de Sistemas",
        description: null,
        schedule_text: null,
        head_name: null,
        contact: null,
        is_active: true,
      });
      expect(result).toEqual(mockDepartment);
    });
  });

  describe("update", () => {
    it("throws 404 when department does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update("missing", { name: "Nuevo nombre" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Departamento no encontrado",
      });
    });

    it("throws 404 when new building_id does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockDepartment);
      repository.buildingExists.mockResolvedValue(false);

      await expect(
        service.update("department-1", { building_id: "building-x" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "El edificio indicado no existe",
      });
    });

    it("updates department and returns updated data", async () => {
      const { service, repository } = createService();
      repository.findById
        .mockResolvedValueOnce(mockDepartment)
        .mockResolvedValueOnce({ ...mockDepartment, name: "Actualizado" });
      repository.update.mockResolvedValue(undefined);

      const result = await service.update("department-1", { name: "Actualizado" });

      expect(repository.update).toHaveBeenCalledWith("department-1", {
        building_id: mockDepartment.building_id,
        name: "Actualizado",
        description: mockDepartment.description,
        schedule_text: mockDepartment.schedule_text,
        head_name: mockDepartment.head_name,
        contact: mockDepartment.contact,
        is_active: true,
      });
      expect(result.name).toBe("Actualizado");
    });
  });

  describe("updateStatus", () => {
    it("throws 404 when department does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.updateStatus("missing", true)).rejects.toMatchObject({
        statusCode: 404,
        message: "Departamento no encontrado",
      });
    });

    it("updates status and returns updated department", async () => {
      const { service, repository } = createService();
      repository.findById
        .mockResolvedValueOnce(mockDepartment)
        .mockResolvedValueOnce({ ...mockDepartment, is_active: false });
      repository.updateStatus.mockResolvedValue(undefined);

      const result = await service.updateStatus("department-1", false);

      expect(repository.updateStatus).toHaveBeenCalledWith("department-1", false);
      expect(result.is_active).toBe(false);
    });
  });

  describe("remove", () => {
    it("throws 404 when department does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.remove("missing")).rejects.toBeInstanceOf(ApiError);
    });

    it("soft deletes department and returns deleted result", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockDepartment);
      repository.softDelete.mockResolvedValue(undefined);

      await expect(service.remove("department-1")).resolves.toEqual({
        id: "department-1",
        deleted: true,
      });

      expect(repository.softDelete).toHaveBeenCalledWith("department-1");
    });
  });
});
