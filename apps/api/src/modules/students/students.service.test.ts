import { describe, it, expect, vi, beforeEach } from "vitest";
import { StudentsService } from "./students.service.js";
import { StudentsRepository } from "./students.repository.js";
import { ApiError } from "../../shared/errors/api-error.js";

vi.mock("./students.repository.js");

const mockStudent = {
  id: "stu-1",
  control_number: "20221001",
  full_name: "Ana García",
  email: "ana@ito.mx",
  program: "Ingeniería en Sistemas",
  semester: 4,
  is_active: 1,
  deleted_at: null,
};

const mockLocation = {
  schedule_id: "sched-1",
  subject: "Cálculo Diferencial",
  day_of_week: 1,
  start_time: "09:00",
  end_time: "11:00",
  period: "2026-1",
  classroom_id: "cls-1",
  classroom_code: "A-101",
  classroom_name: "Aula 101",
  classroom_floor: 1,
  building_id: "bld-1",
  building_code: "A",
  building_name: "Edificio A",
};

describe("StudentsService", () => {
  let service: StudentsService;
  let repo: StudentsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new StudentsRepository();
    service = new StudentsService(repo);
  });

  // getAll
  it("returns list of students", async () => {
    vi.mocked(repo.findAll).mockResolvedValue([mockStudent as any]);
    const result = await service.getAll();
    expect(result).toHaveLength(1);
    expect(result[0].control_number).toBe("20221001");
  });

  // getById
  it("throws 404 when student not found by id", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(service.getById("x")).rejects.toThrow(ApiError);
  });

  it("returns student when found by id", async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockStudent as any);
    const result = await service.getById("stu-1");
    expect(result.id).toBe("stu-1");
  });

  // create
  it("throws 409 when control_number already exists", async () => {
    vi.mocked(repo.findByControlNumber).mockResolvedValue(mockStudent as any);
    await expect(
      service.create({
        control_number: "20221001",
        full_name: "X",
        program: "ISC",
        semester: 1,
      })
    ).rejects.toThrow(ApiError);
  });

  it("creates student with default is_active=true", async () => {
    vi.mocked(repo.findByControlNumber).mockResolvedValue(null);
    vi.mocked(repo.create).mockResolvedValue("new-id");
    vi.mocked(repo.findById).mockResolvedValue({ ...mockStudent, id: "new-id" } as any);
    const result = await service.create({
      control_number: "20221002",
      full_name: "Pedro",
      program: "ISC",
      semester: 2,
    });
    expect(result.id).toBe("new-id");
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: true })
    );
  });

  it("creates student with provided is_active=false", async () => {
    vi.mocked(repo.findByControlNumber).mockResolvedValue(null);
    vi.mocked(repo.create).mockResolvedValue("new-id");
    vi.mocked(repo.findById).mockResolvedValue({ ...mockStudent, id: "new-id", is_active: 0 } as any);
    await service.create({
      control_number: "20221003",
      full_name: "María",
      program: "ISC",
      semester: 3,
      is_active: false,
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false })
    );
  });

  // update
  it("throws 404 on update when student not found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(service.update("x", {})).rejects.toThrow(ApiError);
  });

  it("throws 409 on update when new control_number conflicts", async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockStudent as any);
    vi.mocked(repo.findByControlNumberExcluding).mockResolvedValue({
      ...mockStudent,
      id: "other",
      control_number: "20221999",
    } as any);
    await expect(service.update("stu-1", { control_number: "20221999" })).rejects.toThrow(ApiError);
  });

  it("updates student successfully without control_number conflict check when unchanged", async () => {
    vi.mocked(repo.findById)
      .mockResolvedValueOnce(mockStudent as any)
      .mockResolvedValueOnce({ ...mockStudent, full_name: "Ana Updated" } as any);
    vi.mocked(repo.update).mockResolvedValue(undefined);
    const result = await service.update("stu-1", { full_name: "Ana Updated" });
    expect(result.full_name).toBe("Ana Updated");
    expect(repo.findByControlNumberExcluding).not.toHaveBeenCalled();
  });

  // updateStatus
  it("throws 404 on updateStatus when not found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(service.updateStatus("x", true)).rejects.toThrow(ApiError);
  });

  it("updates status successfully", async () => {
    vi.mocked(repo.findById)
      .mockResolvedValueOnce(mockStudent as any)
      .mockResolvedValueOnce({ ...mockStudent, is_active: 0 } as any);
    vi.mocked(repo.updateStatus).mockResolvedValue(undefined);
    const result = await service.updateStatus("stu-1", false);
    expect(repo.updateStatus).toHaveBeenCalledWith("stu-1", false);
    expect(result.is_active).toBe(0);
  });

  // remove
  it("throws 404 on remove when not found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(service.remove("x")).rejects.toThrow(ApiError);
  });

  it("soft deletes student and returns id+deleted", async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockStudent as any);
    vi.mocked(repo.softDelete).mockResolvedValue(undefined);
    const result = await service.remove("stu-1");
    expect(result).toEqual({ id: "stu-1", deleted: true });
    expect(repo.softDelete).toHaveBeenCalledWith("stu-1");
  });

  // getLocation
  it("throws 404 when student not found for location", async () => {
    vi.mocked(repo.findByControlNumber).mockResolvedValue(null);
    await expect(service.getLocation("99999")).rejects.toThrow(ApiError);
  });

  it("throws 404 when student is inactive for location", async () => {
    vi.mocked(repo.findByControlNumber).mockResolvedValue({
      ...mockStudent,
      is_active: 0,
    } as any);
    await expect(service.getLocation("20221001")).rejects.toThrow(ApiError);
  });

  it("returns in_class=false when no schedule matches", async () => {
    vi.mocked(repo.findByControlNumber).mockResolvedValue(mockStudent as any);
    vi.mocked(repo.findCurrentLocation).mockResolvedValue(null);
    const result = await service.getLocation("20221001");
    expect(result.in_class).toBe(false);
    expect(result.schedule).toBeNull();
    expect(result.classroom).toBeNull();
    expect(result.building).toBeNull();
    expect(result.student.control_number).toBe("20221001");
  });

  it("returns in_class=true with location details when schedule matches", async () => {
    vi.mocked(repo.findByControlNumber).mockResolvedValue(mockStudent as any);
    vi.mocked(repo.findCurrentLocation).mockResolvedValue(mockLocation as any);
    const result = await service.getLocation("20221001", "2026-1", "10:00");
    expect(result.in_class).toBe(true);
    expect(result.schedule?.subject).toBe("Cálculo Diferencial");
    expect(result.classroom?.code).toBe("A-101");
    expect(result.building?.name).toBe("Edificio A");
  });

  it("passes period and formatted time to repository", async () => {
    vi.mocked(repo.findByControlNumber).mockResolvedValue(mockStudent as any);
    vi.mocked(repo.findCurrentLocation).mockResolvedValue(null);
    await service.getLocation("20221001", "2026-1", "09:30");
    expect(repo.findCurrentLocation).toHaveBeenCalledWith(
      "stu-1",
      expect.any(Number),
      "09:30:00",
      "2026-1"
    );
  });
});
