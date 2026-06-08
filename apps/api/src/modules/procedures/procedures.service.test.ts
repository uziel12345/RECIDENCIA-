import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProceduresService } from "./procedures.service.js";
import { ApiError } from "../../shared/errors/api-error.js";

const mockProcedure = {
  id: "proc-1",
  name: "Constancia de estudios",
  slug: "constancia-estudios",
  description: "Obtén tu constancia de estudios",
  kind: "tramite" as const,
  is_active: true,
  deleted_at: null,
};

const mockRequirement = {
  id: "req-1",
  procedure_id: "proc-1",
  description: "CURP",
  is_mandatory: true,
  display_order: 0,
};

const mockBuilding = { id: "building-1", code: "DIR", name: "Dirección", notes: null };

function createMockRepository() {
  return {
    findAllActive: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findRequirementsByProcedure: vi.fn(),
    findRequirementsByProcedureIds: vi.fn(),
    findBuildingsByProcedure: vi.fn(),
    findByBuilding: vi.fn(),
    create: vi.fn(),
    createRequirements: vi.fn(),
    update: vi.fn(),
    replaceRequirements: vi.fn(),
    updateStatus: vi.fn(),
    softDelete: vi.fn(),
    findRequirementById: vi.fn(),
    addRequirement: vi.fn(),
    updateRequirement: vi.fn(),
    deleteRequirement: vi.fn(),
    linkBuilding: vi.fn(),
    unlinkBuilding: vi.fn(),
    findBuildingProcedure: vi.fn(),
    buildingExists: vi.fn(),
  };
}

function createService() {
  const repository = createMockRepository();
  return { repository, service: new ProceduresService(repository as any) };
}

describe("ProceduresService", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── getAll ──────────────────────────────────────────────────

  describe("getAll", () => {
    it("delegates to repository with empty filters", async () => {
      const { service, repository } = createService();
      repository.findAllActive.mockResolvedValue([mockProcedure]);
      await expect(service.getAll({})).resolves.toEqual([mockProcedure]);
      expect(repository.findAllActive).toHaveBeenCalledWith({});
    });

    it("passes kind and buildingId filters", async () => {
      const { service, repository } = createService();
      repository.findAllActive.mockResolvedValue([mockProcedure]);
      await service.getAll({ kind: "tramite", buildingId: "building-1" });
      expect(repository.findAllActive).toHaveBeenCalledWith({
        kind: "tramite",
        buildingId: "building-1",
      });
    });
  });

  // ── getById ─────────────────────────────────────────────────

  describe("getById", () => {
    it("throws 404 when procedure does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);
      await expect(service.getById("missing")).rejects.toMatchObject({
        statusCode: 404,
        message: "Trámite/servicio no encontrado",
      });
    });

    it("returns procedure with requirements and buildings", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockProcedure);
      repository.findRequirementsByProcedure.mockResolvedValue([mockRequirement]);
      repository.findBuildingsByProcedure.mockResolvedValue([mockBuilding]);

      const result = await service.getById("proc-1");

      expect(result).toMatchObject({
        ...mockProcedure,
        requirements: [mockRequirement],
        buildings: [mockBuilding],
      });
    });
  });

  // ── getByBuilding ────────────────────────────────────────────

  describe("getByBuilding", () => {
    it("throws 404 when building does not exist", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(false);
      await expect(service.getByBuilding("building-x")).rejects.toMatchObject({
        statusCode: 404,
        message: "Edificio no encontrado",
      });
    });

    it("returns empty array when building has no procedures", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.findByBuilding.mockResolvedValue([]);
      await expect(service.getByBuilding("building-1")).resolves.toEqual([]);
      expect(repository.findRequirementsByProcedureIds).not.toHaveBeenCalled();
    });

    it("returns procedures with requirements merged", async () => {
      const { service, repository } = createService();
      const procForBuilding = { ...mockProcedure, notes: "Ventanilla 3" };
      repository.buildingExists.mockResolvedValue(true);
      repository.findByBuilding.mockResolvedValue([procForBuilding]);
      repository.findRequirementsByProcedureIds.mockResolvedValue([mockRequirement]);

      const result = await service.getByBuilding("building-1");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "proc-1",
        notes: "Ventanilla 3",
        requirements: [mockRequirement],
      });
      expect(repository.findRequirementsByProcedureIds).toHaveBeenCalledWith(["proc-1"]);
    });
  });

  // ── create ───────────────────────────────────────────────────

  describe("create", () => {
    it("throws 409 when slug already exists", async () => {
      const { service, repository } = createService();
      repository.findBySlug.mockResolvedValue(mockProcedure);

      await expect(
        service.create({
          name: "Otro trámite",
          slug: "constancia-estudios",
          kind: "tramite",
        })
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(repository.create).not.toHaveBeenCalled();
    });

    it("creates procedure without requirements", async () => {
      const { service, repository } = createService();
      repository.findBySlug.mockResolvedValue(null);
      repository.create.mockResolvedValue("proc-1");
      repository.findById.mockResolvedValue(mockProcedure);
      repository.findRequirementsByProcedure.mockResolvedValue([]);
      repository.findBuildingsByProcedure.mockResolvedValue([]);

      await service.create({ name: "Constancia", slug: "constancia", kind: "tramite" });

      expect(repository.create).toHaveBeenCalledWith({
        name: "Constancia",
        slug: "constancia",
        description: null,
        kind: "tramite",
        is_active: true,
      });
      expect(repository.createRequirements).not.toHaveBeenCalled();
    });

    it("creates procedure with requirements in payload", async () => {
      const { service, repository } = createService();
      repository.findBySlug.mockResolvedValue(null);
      repository.create.mockResolvedValue("proc-1");
      repository.findById.mockResolvedValue(mockProcedure);
      repository.findRequirementsByProcedure.mockResolvedValue([mockRequirement]);
      repository.findBuildingsByProcedure.mockResolvedValue([]);

      await service.create({
        name: "Constancia",
        slug: "constancia",
        kind: "tramite",
        requirements: [{ description: "CURP", is_mandatory: true, display_order: 0 }],
      });

      expect(repository.createRequirements).toHaveBeenCalledWith("proc-1", [
        { description: "CURP", is_mandatory: true, display_order: 0 },
      ]);
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe("update", () => {
    it("throws 404 when procedure does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);
      await expect(service.update("missing", { name: "X" })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("throws 409 when new slug conflicts with another procedure", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockProcedure);
      // findBySlug called with the NEW slug — returns a different procedure that owns it
      repository.findBySlug.mockResolvedValue({ ...mockProcedure, id: "proc-2" });

      await expect(
        service.update("proc-1", { slug: "horario-tramites" }) // slug diferente al actual
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(repository.update).not.toHaveBeenCalled();
    });

    it("does not check slug uniqueness when slug is unchanged", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockProcedure);
      repository.update.mockResolvedValue(undefined);
      repository.findRequirementsByProcedure.mockResolvedValue([]);
      repository.findBuildingsByProcedure.mockResolvedValue([]);
      // make second findById (for getById) return the procedure
      repository.findById
        .mockResolvedValueOnce(mockProcedure)
        .mockResolvedValueOnce(mockProcedure);

      await service.update("proc-1", { name: "Nuevo nombre" });

      expect(repository.findBySlug).not.toHaveBeenCalled();
    });

    it("replaces requirements when requirements key is present", async () => {
      const { service, repository } = createService();
      repository.findById
        .mockResolvedValueOnce(mockProcedure)
        .mockResolvedValueOnce(mockProcedure);
      repository.update.mockResolvedValue(undefined);
      repository.replaceRequirements.mockResolvedValue(undefined);
      repository.findRequirementsByProcedure.mockResolvedValue([]);
      repository.findBuildingsByProcedure.mockResolvedValue([]);

      await service.update("proc-1", {
        requirements: [{ description: "Nuevo requisito" }],
      });

      expect(repository.replaceRequirements).toHaveBeenCalledWith("proc-1", [
        { description: "Nuevo requisito" },
      ]);
    });

    it("does not touch requirements when requirements key is absent", async () => {
      const { service, repository } = createService();
      repository.findById
        .mockResolvedValueOnce(mockProcedure)
        .mockResolvedValueOnce(mockProcedure);
      repository.update.mockResolvedValue(undefined);
      repository.findRequirementsByProcedure.mockResolvedValue([]);
      repository.findBuildingsByProcedure.mockResolvedValue([]);

      await service.update("proc-1", { name: "Nombre actualizado" });

      expect(repository.replaceRequirements).not.toHaveBeenCalled();
    });
  });

  // ── updateStatus ────────────────────────────────────────────

  describe("updateStatus", () => {
    it("throws 404 when procedure does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);
      await expect(service.updateStatus("missing", true)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("updates status and returns updated procedure", async () => {
      const { service, repository } = createService();
      repository.findById
        .mockResolvedValueOnce(mockProcedure)
        .mockResolvedValueOnce({ ...mockProcedure, is_active: false });
      repository.updateStatus.mockResolvedValue(undefined);
      repository.findRequirementsByProcedure.mockResolvedValue([]);
      repository.findBuildingsByProcedure.mockResolvedValue([]);

      const result = await service.updateStatus("proc-1", false);

      expect(repository.updateStatus).toHaveBeenCalledWith("proc-1", false);
      expect(result.is_active).toBe(false);
    });
  });

  // ── remove ──────────────────────────────────────────────────

  describe("remove", () => {
    it("throws 404 when procedure does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);
      await expect(service.remove("missing")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("soft deletes and returns deleted result", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockProcedure);
      repository.softDelete.mockResolvedValue(undefined);

      await expect(service.remove("proc-1")).resolves.toEqual({
        id: "proc-1",
        deleted: true,
      });
      expect(repository.softDelete).toHaveBeenCalledWith("proc-1");
    });

    it("throws ApiError instance on not found", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);
      await expect(service.remove("missing")).rejects.toBeInstanceOf(ApiError);
    });
  });

  // ── addRequirement ───────────────────────────────────────────

  describe("addRequirement", () => {
    it("throws 404 when procedure does not exist", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(null);
      await expect(
        service.addRequirement("missing", { description: "Doc" })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("adds requirement and returns it", async () => {
      const { service, repository } = createService();
      repository.findById.mockResolvedValue(mockProcedure);
      repository.addRequirement.mockResolvedValue("req-1");
      repository.findRequirementById.mockResolvedValue(mockRequirement);

      const result = await service.addRequirement("proc-1", { description: "CURP" });

      expect(repository.addRequirement).toHaveBeenCalledWith("proc-1", {
        description: "CURP",
      });
      expect(result).toEqual(mockRequirement);
    });
  });

  // ── updateRequirement ────────────────────────────────────────

  describe("updateRequirement", () => {
    it("throws 404 when requirement does not exist", async () => {
      const { service, repository } = createService();
      repository.findRequirementById.mockResolvedValue(null);
      await expect(
        service.updateRequirement("missing", { description: "X" })
      ).rejects.toMatchObject({ statusCode: 404, message: "Requisito no encontrado" });
    });

    it("updates and returns updated requirement", async () => {
      const { service, repository } = createService();
      repository.findRequirementById
        .mockResolvedValueOnce(mockRequirement)
        .mockResolvedValueOnce({ ...mockRequirement, description: "Actualizado" });
      repository.updateRequirement.mockResolvedValue(undefined);

      const result = await service.updateRequirement("req-1", {
        description: "Actualizado",
      });

      expect(repository.updateRequirement).toHaveBeenCalledWith("req-1", {
        description: "Actualizado",
      });
      expect(result?.description).toBe("Actualizado");
    });
  });

  // ── deleteRequirement ────────────────────────────────────────

  describe("deleteRequirement", () => {
    it("throws 404 when requirement does not exist", async () => {
      const { service, repository } = createService();
      repository.findRequirementById.mockResolvedValue(null);
      await expect(service.deleteRequirement("missing")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("deletes and returns deleted result", async () => {
      const { service, repository } = createService();
      repository.findRequirementById.mockResolvedValue(mockRequirement);
      repository.deleteRequirement.mockResolvedValue(undefined);

      await expect(service.deleteRequirement("req-1")).resolves.toEqual({
        id: "req-1",
        deleted: true,
      });
    });
  });

  // ── linkBuilding ─────────────────────────────────────────────

  describe("linkBuilding", () => {
    it("throws 404 when building does not exist", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(false);
      await expect(
        service.linkBuilding("building-x", { procedure_id: "proc-1" })
      ).rejects.toMatchObject({ statusCode: 404, message: "Edificio no encontrado" });
    });

    it("throws 404 when procedure does not exist", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.findById.mockResolvedValue(null);
      await expect(
        service.linkBuilding("building-1", { procedure_id: "proc-x" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Trámite/servicio no encontrado",
      });
    });

    it("throws 409 when already linked", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.findById.mockResolvedValue(mockProcedure);
      repository.findBuildingProcedure.mockResolvedValue({
        building_id: "building-1",
        procedure_id: "proc-1",
      });

      await expect(
        service.linkBuilding("building-1", { procedure_id: "proc-1" })
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(repository.linkBuilding).not.toHaveBeenCalled();
    });

    it("links building and returns link data", async () => {
      const { service, repository } = createService();
      repository.buildingExists.mockResolvedValue(true);
      repository.findById.mockResolvedValue(mockProcedure);
      repository.findBuildingProcedure.mockResolvedValue(null);
      repository.linkBuilding.mockResolvedValue(undefined);

      const result = await service.linkBuilding("building-1", {
        procedure_id: "proc-1",
        notes: "Ventanilla 3",
      });

      expect(repository.linkBuilding).toHaveBeenCalledWith(
        "building-1",
        "proc-1",
        "Ventanilla 3"
      );
      expect(result).toEqual({
        building_id: "building-1",
        procedure_id: "proc-1",
        notes: "Ventanilla 3",
      });
    });
  });

  // ── unlinkBuilding ───────────────────────────────────────────

  describe("unlinkBuilding", () => {
    it("throws 404 when link does not exist", async () => {
      const { service, repository } = createService();
      repository.findBuildingProcedure.mockResolvedValue(null);
      await expect(
        service.unlinkBuilding("building-1", "proc-1")
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("unlinks and returns deleted result", async () => {
      const { service, repository } = createService();
      repository.findBuildingProcedure.mockResolvedValue({
        building_id: "building-1",
        procedure_id: "proc-1",
      });
      repository.unlinkBuilding.mockResolvedValue(undefined);

      await expect(
        service.unlinkBuilding("building-1", "proc-1")
      ).resolves.toEqual({
        building_id: "building-1",
        procedure_id: "proc-1",
        deleted: true,
      });
      expect(repository.unlinkBuilding).toHaveBeenCalledWith("building-1", "proc-1");
    });
  });
});
