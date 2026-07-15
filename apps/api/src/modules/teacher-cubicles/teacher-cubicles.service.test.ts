import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeacherCubiclesService } from "./teacher-cubicles.service.js";
import { ApiError } from "../../shared/errors/api-error.js";

const mockCubicle = {
  id: "cubicle-1",
  building_id: "building-1",
  building_code: "DIR",
  building_name: "Dirección",
  code: "CUB-101",
  professor_id: "professor-1",
  professor_name: "Ing. Juan Pérez",
  department_id: "department-1",
  department_name: "Departamento de Sistemas",
  schedule_text: "Lunes a viernes 8:00-15:00",
  notes: "Cubículo compartido",
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
    professorExists: vi.fn(),
    departmentExists: vi.fn(),
  };
}

function createService() {
  const repository = createMockRepository();
  return {
    repository,
    service: new TeacherCubiclesService(repository as any),
  };
}

describe("TeacherCubiclesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("delegates to repository.findAllActive without filter", async () => {
      const { service, repository } = createService();
      repository.findAllActive.mockResolvedValue([mockCubicle]);

      await expect(service.getAll()).resolves.toEqual([mockCubicle]);
      expect(repository.findAllActive).toHaveBeenCalledWith(undefined);
    });

    it("passes buildingId filter to repository", async () => {
      const { service, repository } = createService();
      repository.findAllActive.mockResolvedValue([mockCubicle]);

      await expect(service.getAll("building-1")).resolves.toEqual([mockCubicle]);
      expect(repository.findAllActive).toHaveBeenCalledWith("building-1");
    });
  });

  describe("getById", () => {
    it("throws 404 when cubicle does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.getById("missing")).rejects.toMatchObject({
        statusCode: 404,
        message: "Cubículo no encontrado",
      });
    });

    it("returns cubicle when it exists", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockCubicle);

      await expect(service.getById("cubicle-1")).resolves.toEqual(mockCubicle);
    });
  });

  describe("create", () => {
    it("throws 404 when building does not exist", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(false);

      await expect(
        service.create({ building_id: "building-x", code: "CUB-101" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "El edificio indicado no existe",
      });

      expect(repository.findByBuildingAndCode).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it("throws 404 when professor_id is given but professor does not exist", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.professorExists.mockResolvedValue(false);

      await expect(
        service.create({
          building_id: "building-1",
          code: "CUB-101",
          professor_id: "professor-x",
        })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "El profesor indicado no existe",
      });

      expect(repository.create).not.toHaveBeenCalled();
    });

    it("throws 404 when department_id is given but department does not exist", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.departmentExists.mockResolvedValue(false);

      await expect(
        service.create({
          building_id: "building-1",
          code: "CUB-101",
          department_id: "department-x",
        })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "El departamento indicado no existe",
      });

      expect(repository.create).not.toHaveBeenCalled();
    });

    it("throws 409 when code already exists in that building", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.findByBuildingAndCode.mockResolvedValue(mockCubicle);

      await expect(
        service.create({ building_id: "building-1", code: "CUB-101" })
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(repository.create).not.toHaveBeenCalled();
    });

    it("creates cubicle with defaults and returns created cubicle", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.findByBuildingAndCode.mockResolvedValue(null);
      repository.create.mockResolvedValue("cubicle-1");
      repository.findById.mockResolvedValue(mockCubicle);

      const result = await service.create({
        building_id: "building-1",
        code: "CUB-101",
      });

      expect(repository.create).toHaveBeenCalledWith({
        building_id: "building-1",
        code: "CUB-101",
        professor_id: null,
        department_id: null,
        schedule_text: null,
        notes: null,
        is_active: true,
      });
      expect(result).toEqual(mockCubicle);
    });

    it("creates cubicle with all explicit fields", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.professorExists.mockResolvedValue(true);
      repository.departmentExists.mockResolvedValue(true);
      repository.findByBuildingAndCode.mockResolvedValue(null);
      repository.create.mockResolvedValue("cubicle-1");
      repository.findById.mockResolvedValue(mockCubicle);

      await service.create({
        building_id: "building-1",
        code: "CUB-202",
        professor_id: "professor-1",
        department_id: "department-1",
        schedule_text: "Lunes a viernes 8:00-15:00",
        notes: "Cubículo compartido",
        is_active: false,
      });

      expect(repository.create).toHaveBeenCalledWith({
        building_id: "building-1",
        code: "CUB-202",
        professor_id: "professor-1",
        department_id: "department-1",
        schedule_text: "Lunes a viernes 8:00-15:00",
        notes: "Cubículo compartido",
        is_active: false,
      });
    });
  });

  describe("update", () => {
    it("throws 404 when cubicle does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update("missing", { code: "CUB-999" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Cubículo no encontrado",
      });
    });

    it("throws 404 when new building_id does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockCubicle);
      repository.buildingExists.mockResolvedValue(false);

      await expect(
        service.update("cubicle-1", { building_id: "building-x" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "El edificio indicado no existe",
      });
    });

    it("throws 404 when new professor_id does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockCubicle);
      repository.professorExists.mockResolvedValue(false);

      await expect(
        service.update("cubicle-1", { professor_id: "professor-x" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "El profesor indicado no existe",
      });
    });

    it("throws 404 when new department_id does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockCubicle);
      repository.departmentExists.mockResolvedValue(false);

      await expect(
        service.update("cubicle-1", { department_id: "department-x" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "El departamento indicado no existe",
      });
    });

    it("throws 409 on code conflict with another cubicle", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockCubicle);
      repository.findByBuildingAndCode.mockResolvedValue({
        ...mockCubicle,
        id: "cubicle-2",
      });

      await expect(
        service.update("cubicle-1", { code: "CUB-101" })
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(repository.update).not.toHaveBeenCalled();
    });

    it("updates cubicle and returns updated data", async () => {
      const { service, repository } = createService();
      repository.findById
        .mockResolvedValueOnce(mockCubicle)
        .mockResolvedValueOnce({ ...mockCubicle, notes: "Actualizado" });
      repository.findByBuildingAndCode.mockResolvedValue(null);
      repository.update.mockResolvedValue(undefined);

      const result = await service.update("cubicle-1", { notes: "Actualizado" });

      expect(repository.update).toHaveBeenCalledWith("cubicle-1", {
        building_id: mockCubicle.building_id,
        code: mockCubicle.code,
        professor_id: mockCubicle.professor_id,
        department_id: mockCubicle.department_id,
        schedule_text: mockCubicle.schedule_text,
        notes: "Actualizado",
        is_active: true,
      });
      expect(result.notes).toBe("Actualizado");
    });
  });

  describe("updateStatus", () => {
    it("throws 404 when cubicle does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.updateStatus("missing", true)).rejects.toMatchObject({
        statusCode: 404,
        message: "Cubículo no encontrado",
      });
    });

    it("updates status and returns updated cubicle", async () => {
      const { service, repository } = createService();
      repository.findById
        .mockResolvedValueOnce(mockCubicle)
        .mockResolvedValueOnce({ ...mockCubicle, is_active: false });
      repository.updateStatus.mockResolvedValue(undefined);

      const result = await service.updateStatus("cubicle-1", false);

      expect(repository.updateStatus).toHaveBeenCalledWith("cubicle-1", false);
      expect(result.is_active).toBe(false);
    });
  });

  describe("remove", () => {
    it("throws 404 when cubicle does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);

      await expect(service.remove("missing")).rejects.toBeInstanceOf(ApiError);
    });

    it("soft deletes cubicle and returns deleted result", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockCubicle);
      repository.softDelete.mockResolvedValue(undefined);

      await expect(service.remove("cubicle-1")).resolves.toEqual({
        id: "cubicle-1",
        deleted: true,
      });

      expect(repository.softDelete).toHaveBeenCalledWith("cubicle-1");
    });
  });
});
