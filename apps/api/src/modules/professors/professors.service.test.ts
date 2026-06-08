import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfessorsService } from "./professors.service.js";
import { ProfessorsRepository } from "./professors.repository.js";
import { ApiError } from "../../shared/errors/api-error.js";

vi.mock("./professors.repository.js");

const mockProfessor = {
  id: "prof-1",
  employee_number: "EMP001",
  full_name: "Dr. Luis Hernández",
  email: "luis@ito.mx",
  department: "Sistemas y Computación",
  is_active: 1,
  deleted_at: null,
};

const mockLocation = {
  schedule_id: "sched-2",
  subject: "Programación Avanzada",
  day_of_week: 2,
  start_time: "10:00",
  end_time: "12:00",
  period: "2026-1",
  classroom_id: "cls-2",
  classroom_code: "B-201",
  classroom_name: "Lab 201",
  classroom_floor: 2,
  building_id: "bld-2",
  building_code: "B",
  building_name: "Edificio B",
};

describe("ProfessorsService", () => {
  let service: ProfessorsService;
  let repo: ProfessorsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new ProfessorsRepository();
    service = new ProfessorsService(repo);
  });

  // getAll
  it("returns list of professors", async () => {
    vi.mocked(repo.findAll).mockResolvedValue([mockProfessor as any]);
    const result = await service.getAll();
    expect(result).toHaveLength(1);
    expect(result[0].employee_number).toBe("EMP001");
  });

  // getById
  it("throws 404 when professor not found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(service.getById("x")).rejects.toThrow(ApiError);
  });

  it("returns professor when found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockProfessor as any);
    const result = await service.getById("prof-1");
    expect(result.id).toBe("prof-1");
  });

  // create
  it("throws 409 when employee_number already exists", async () => {
    vi.mocked(repo.findByEmployeeNumber).mockResolvedValue(mockProfessor as any);
    await expect(
      service.create({
        employee_number: "EMP001",
        full_name: "X",
        department: "D",
      })
    ).rejects.toThrow(ApiError);
  });

  it("creates professor with default is_active=true", async () => {
    vi.mocked(repo.findByEmployeeNumber).mockResolvedValue(null);
    vi.mocked(repo.create).mockResolvedValue("new-id");
    vi.mocked(repo.findById).mockResolvedValue({ ...mockProfessor, id: "new-id" } as any);
    await service.create({ employee_number: "EMP002", full_name: "Nueva", department: "D" });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: true })
    );
  });

  // update
  it("throws 404 on update when professor not found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(service.update("x", {})).rejects.toThrow(ApiError);
  });

  it("throws 409 on update when new employee_number conflicts", async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockProfessor as any);
    vi.mocked(repo.findByEmployeeNumberExcluding).mockResolvedValue({
      ...mockProfessor,
      id: "other",
      employee_number: "EMP999",
    } as any);
    await expect(service.update("prof-1", { employee_number: "EMP999" })).rejects.toThrow(ApiError);
  });

  it("updates professor without triggering uniqueness check when employee_number unchanged", async () => {
    vi.mocked(repo.findById)
      .mockResolvedValueOnce(mockProfessor as any)
      .mockResolvedValueOnce({ ...mockProfessor, department: "ISC" } as any);
    vi.mocked(repo.update).mockResolvedValue(undefined);
    const result = await service.update("prof-1", { department: "ISC" });
    expect(result.department).toBe("ISC");
    expect(repo.findByEmployeeNumberExcluding).not.toHaveBeenCalled();
  });

  // updateStatus
  it("throws 404 on updateStatus when not found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(service.updateStatus("x", false)).rejects.toThrow(ApiError);
  });

  it("updates status successfully", async () => {
    vi.mocked(repo.findById)
      .mockResolvedValueOnce(mockProfessor as any)
      .mockResolvedValueOnce({ ...mockProfessor, is_active: 0 } as any);
    vi.mocked(repo.updateStatus).mockResolvedValue(undefined);
    await service.updateStatus("prof-1", false);
    expect(repo.updateStatus).toHaveBeenCalledWith("prof-1", false);
  });

  // remove
  it("throws 404 on remove when not found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(service.remove("x")).rejects.toThrow(ApiError);
  });

  it("soft deletes professor and returns result", async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockProfessor as any);
    vi.mocked(repo.softDelete).mockResolvedValue(undefined);
    const result = await service.remove("prof-1");
    expect(result).toEqual({ id: "prof-1", deleted: true });
  });

  // getLocation
  it("throws 404 when professor not found for location", async () => {
    vi.mocked(repo.findByEmployeeNumber).mockResolvedValue(null);
    await expect(service.getLocation("EMP999")).rejects.toThrow(ApiError);
  });

  it("throws 404 when professor is inactive for location", async () => {
    vi.mocked(repo.findByEmployeeNumber).mockResolvedValue({
      ...mockProfessor,
      is_active: 0,
    } as any);
    await expect(service.getLocation("EMP001")).rejects.toThrow(ApiError);
  });

  it("returns in_class=false when professor has no active schedule", async () => {
    vi.mocked(repo.findByEmployeeNumber).mockResolvedValue(mockProfessor as any);
    vi.mocked(repo.findCurrentLocation).mockResolvedValue(null);
    const result = await service.getLocation("EMP001");
    expect(result.in_class).toBe(false);
    expect(result.schedule).toBeNull();
    expect(result.professor.employee_number).toBe("EMP001");
  });

  it("returns in_class=true with classroom and building when schedule matches", async () => {
    vi.mocked(repo.findByEmployeeNumber).mockResolvedValue(mockProfessor as any);
    vi.mocked(repo.findCurrentLocation).mockResolvedValue(mockLocation as any);
    const result = await service.getLocation("EMP001", "2026-1", "11:00");
    expect(result.in_class).toBe(true);
    expect(result.schedule?.subject).toBe("Programación Avanzada");
    expect(result.classroom?.code).toBe("B-201");
    expect(result.building?.name).toBe("Edificio B");
  });

  it("passes period and formatted time to repository", async () => {
    vi.mocked(repo.findByEmployeeNumber).mockResolvedValue(mockProfessor as any);
    vi.mocked(repo.findCurrentLocation).mockResolvedValue(null);
    await service.getLocation("EMP001", "2026-2", "14:00");
    expect(repo.findCurrentLocation).toHaveBeenCalledWith(
      "prof-1",
      expect.any(Number),
      "14:00:00",
      "2026-2"
    );
  });
});
