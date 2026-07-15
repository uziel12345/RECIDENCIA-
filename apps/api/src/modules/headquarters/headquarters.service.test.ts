import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeadquartersService } from "./headquarters.service.js";
import { ApiError } from "../../shared/errors/api-error.js";

const mockHeadquarters = {
  id: "headquarters-1",
  building_id: "building-1",
  building_code: "DIR",
  building_name: "Dirección",
  name: "Jefatura de Servicios Escolares",
  head_name: "Ing. Juan Pérez",
  department_id: "department-1",
  department_name: "Departamento de Sistemas",
  schedule_text: "Lunes a viernes 8:00-15:00",
  contact: "servicios@itoaxaca.edu.mx",
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
    departmentExists: vi.fn(),
  };
}

function createService() {
  const repository = createMockRepository();
  return {
    repository,
    service: new HeadquartersService(repository as any),
  };
}

describe("HeadquartersService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("delegates to repository.findAllActive without filter", async () => {
      const { service, repository } = createService();
      repository.findAllActive.mockResolvedValue([mockHeadquarters]);

      await expect(service.getAll()).resolves.toEqual([mockHeadquarters]);
      expect(repository.findAllActive).toHaveBeenCalledWith(undefined);
    });

    it("passes buildingId filter to repository", async () => {
      const { service, repository } = createService();
      repository.findAllActive.mockResolvedValue([mockHeadquarters]);

      await expect(service.getAll("building-1")).resolves.toEqual([mockHeadquarters]);
      expect(repository.findAllActive).toHaveBeenCalledWith("building-1");
    });
  });

  describe("getById", () => {
    it("throws 404 when headquarters does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.getById("missing")).rejects.toMatchObject({
        statusCode: 404,
        message: "Jefatura no encontrada",
      });
    });

    it("returns headquarters when it exists", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockHeadquarters);

      await expect(service.getById("headquarters-1")).resolves.toEqual(mockHeadquarters);
    });
  });

  describe("create", () => {
    it("throws 404 when building does not exist", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(false);

      await expect(
        service.create({ building_id: "building-x", name: "Jefatura" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "El edificio indicado no existe",
      });

      expect(repository.create).not.toHaveBeenCalled();
    });

    it("throws 404 when department_id is provided but does not exist", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.departmentExists.mockResolvedValue(false);

      await expect(
        service.create({
          building_id: "building-1",
          name: "Jefatura",
          department_id: "department-x",
        })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "El departamento indicado no existe",
      });

      expect(repository.create).not.toHaveBeenCalled();
    });

    it("creates headquarters with defaults and returns created headquarters", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.create.mockResolvedValue("headquarters-1");
      repository.findById.mockResolvedValue(mockHeadquarters);

      const result = await service.create({
        building_id: "building-1",
        name: "Jefatura de Servicios Escolares",
      });

      expect(repository.create).toHaveBeenCalledWith({
        building_id: "building-1",
        name: "Jefatura de Servicios Escolares",
        head_name: null,
        department_id: null,
        schedule_text: null,
        contact: null,
        is_active: true,
      });
      expect(repository.departmentExists).not.toHaveBeenCalled();
      expect(result).toEqual(mockHeadquarters);
    });

    it("creates headquarters with a valid department_id", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.departmentExists.mockResolvedValue(true);
      repository.create.mockResolvedValue("headquarters-1");
      repository.findById.mockResolvedValue(mockHeadquarters);

      const result = await service.create({
        building_id: "building-1",
        name: "Jefatura de Servicios Escolares",
        department_id: "department-1",
      });

      expect(repository.departmentExists).toHaveBeenCalledWith("department-1");
      expect(repository.create).toHaveBeenCalledWith({
        building_id: "building-1",
        name: "Jefatura de Servicios Escolares",
        head_name: null,
        department_id: "department-1",
        schedule_text: null,
        contact: null,
        is_active: true,
      });
      expect(result).toEqual(mockHeadquarters);
    });
  });

  describe("update", () => {
    it("throws 404 when headquarters does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update("missing", { name: "Nuevo nombre" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Jefatura no encontrada",
      });
    });

    it("throws 404 when new building_id does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockHeadquarters);
      repository.buildingExists.mockResolvedValue(false);

      await expect(
        service.update("headquarters-1", { building_id: "building-x" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "El edificio indicado no existe",
      });
    });

    it("throws 404 when new department_id does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockHeadquarters);
      repository.departmentExists.mockResolvedValue(false);

      await expect(
        service.update("headquarters-1", { department_id: "department-x" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "El departamento indicado no existe",
      });
    });

    it("updates headquarters and returns updated data", async () => {
      const { service, repository } = createService();
      repository.findById
        .mockResolvedValueOnce(mockHeadquarters)
        .mockResolvedValueOnce({ ...mockHeadquarters, name: "Actualizado" });
      repository.update.mockResolvedValue(undefined);

      const result = await service.update("headquarters-1", { name: "Actualizado" });

      expect(repository.update).toHaveBeenCalledWith("headquarters-1", {
        building_id: mockHeadquarters.building_id,
        name: "Actualizado",
        head_name: mockHeadquarters.head_name,
        department_id: mockHeadquarters.department_id,
        schedule_text: mockHeadquarters.schedule_text,
        contact: mockHeadquarters.contact,
        is_active: true,
      });
      expect(result.name).toBe("Actualizado");
    });
  });

  describe("updateStatus", () => {
    it("throws 404 when headquarters does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.updateStatus("missing", true)).rejects.toMatchObject({
        statusCode: 404,
        message: "Jefatura no encontrada",
      });
    });

    it("updates status and returns updated headquarters", async () => {
      const { service, repository } = createService();
      repository.findById
        .mockResolvedValueOnce(mockHeadquarters)
        .mockResolvedValueOnce({ ...mockHeadquarters, is_active: false });
      repository.updateStatus.mockResolvedValue(undefined);

      const result = await service.updateStatus("headquarters-1", false);

      expect(repository.updateStatus).toHaveBeenCalledWith("headquarters-1", false);
      expect(result.is_active).toBe(false);
    });
  });

  describe("remove", () => {
    it("throws 404 when headquarters does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.remove("missing")).rejects.toBeInstanceOf(ApiError);
    });

    it("soft deletes headquarters and returns deleted result", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockHeadquarters);
      repository.softDelete.mockResolvedValue(undefined);

      await expect(service.remove("headquarters-1")).resolves.toEqual({
        id: "headquarters-1",
        deleted: true,
      });

      expect(repository.softDelete).toHaveBeenCalledWith("headquarters-1");
    });
  });
});
