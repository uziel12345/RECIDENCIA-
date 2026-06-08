import { describe, it, expect, vi, beforeEach } from "vitest";
import { SchedulesService } from "./schedules.service.js";
import { SchedulesRepository } from "./schedules.repository.js";
import { ApiError } from "../../shared/errors/api-error.js";

vi.mock("./schedules.repository.js");

const mockSchedule = {
  id: "sched-1",
  subject: "Cálculo Diferencial",
  professor_id: "prof-1",
  professor_name: "Dr. Luis",
  classroom_id: "cls-1",
  classroom_code: "A-101",
  classroom_name: "Aula 101",
  building_id: "bld-1",
  building_name: "Edificio A",
  day_of_week: 1,
  start_time: "09:00",
  end_time: "11:00",
  period: "2026-1",
};

describe("SchedulesService", () => {
  let service: SchedulesService;
  let repo: SchedulesRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new SchedulesRepository();
    service = new SchedulesService(repo);
  });

  // getAll
  it("returns all schedules", async () => {
    vi.mocked(repo.findAll).mockResolvedValue([mockSchedule as any]);
    const result = await service.getAll();
    expect(result).toHaveLength(1);
  });

  it("passes period filter to repository", async () => {
    vi.mocked(repo.findAll).mockResolvedValue([]);
    await service.getAll("2026-1");
    expect(repo.findAll).toHaveBeenCalledWith("2026-1");
  });

  // getById
  it("throws 404 when schedule not found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(service.getById("x")).rejects.toThrow(ApiError);
  });

  // getByClassroom
  it("returns classroom schedule without personal data", async () => {
    vi.mocked(repo.findByClassroom).mockResolvedValue([
      { id: "sched-1", subject: "Cálculo", day_of_week: 1, start_time: "09:00", end_time: "11:00", period: "2026-1" } as any,
    ]);
    const result = await service.getByClassroom("cls-1", "2026-1", 1);
    expect(result[0].subject).toBe("Cálculo");
    expect(repo.findByClassroom).toHaveBeenCalledWith("cls-1", "2026-1", 1);
  });

  // create
  it("throws 404 when professor not found on create", async () => {
    vi.mocked(repo.professorExists).mockResolvedValue(false);
    await expect(
      service.create({
        subject: "X",
        professor_id: "prof-x",
        classroom_id: "cls-1",
        day_of_week: 1,
        start_time: "09:00",
        end_time: "11:00",
        period: "2026-1",
      })
    ).rejects.toThrow(ApiError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("throws 404 when classroom not found on create", async () => {
    vi.mocked(repo.professorExists).mockResolvedValue(true);
    vi.mocked(repo.classroomExists).mockResolvedValue(false);
    await expect(
      service.create({
        subject: "X",
        professor_id: "prof-1",
        classroom_id: "cls-x",
        day_of_week: 1,
        start_time: "09:00",
        end_time: "11:00",
        period: "2026-1",
      })
    ).rejects.toThrow(ApiError);
  });

  it("creates schedule when professor and classroom exist", async () => {
    vi.mocked(repo.professorExists).mockResolvedValue(true);
    vi.mocked(repo.classroomExists).mockResolvedValue(true);
    vi.mocked(repo.create).mockResolvedValue("new-sched");
    vi.mocked(repo.findById).mockResolvedValue({ ...mockSchedule, id: "new-sched" } as any);
    const result = await service.create({
      subject: "Cálculo",
      professor_id: "prof-1",
      classroom_id: "cls-1",
      day_of_week: 1,
      start_time: "09:00",
      end_time: "11:00",
      period: "2026-1",
    });
    expect(result.id).toBe("new-sched");
  });

  // update
  it("throws 404 on update when schedule not found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(service.update("x", {})).rejects.toThrow(ApiError);
  });

  it("throws 404 when new professor does not exist on update", async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockSchedule as any);
    vi.mocked(repo.professorExists).mockResolvedValue(false);
    await expect(service.update("sched-1", { professor_id: "prof-new" })).rejects.toThrow(ApiError);
  });

  it("throws 404 when new classroom does not exist on update", async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockSchedule as any);
    vi.mocked(repo.professorExists).mockResolvedValue(true);
    vi.mocked(repo.classroomExists).mockResolvedValue(false);
    await expect(service.update("sched-1", { classroom_id: "cls-new" })).rejects.toThrow(ApiError);
  });

  it("updates schedule successfully", async () => {
    vi.mocked(repo.findById)
      .mockResolvedValueOnce(mockSchedule as any)
      .mockResolvedValueOnce({ ...mockSchedule, subject: "Álgebra" } as any);
    vi.mocked(repo.update).mockResolvedValue(undefined);
    const result = await service.update("sched-1", { subject: "Álgebra" });
    expect(result.subject).toBe("Álgebra");
  });

  // remove
  it("throws 404 on remove when not found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(service.remove("x")).rejects.toThrow(ApiError);
  });

  it("removes schedule and returns result", async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockSchedule as any);
    vi.mocked(repo.remove).mockResolvedValue(undefined);
    const result = await service.remove("sched-1");
    expect(result).toEqual({ id: "sched-1", deleted: true });
  });

  // linkStudent
  it("throws 404 on linkStudent when schedule not found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(service.linkStudent("x", "stu-1")).rejects.toThrow(ApiError);
  });

  it("throws 404 on linkStudent when student not found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockSchedule as any);
    vi.mocked(repo.studentExists).mockResolvedValue(false);
    await expect(service.linkStudent("sched-1", "stu-x")).rejects.toThrow(ApiError);
  });

  it("links student to schedule", async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockSchedule as any);
    vi.mocked(repo.studentExists).mockResolvedValue(true);
    vi.mocked(repo.linkStudent).mockResolvedValue(undefined);
    const result = await service.linkStudent("sched-1", "stu-1");
    expect(result).toEqual({ schedule_id: "sched-1", student_id: "stu-1", linked: true });
  });

  // unlinkStudent
  it("throws 404 on unlinkStudent when schedule not found", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(service.unlinkStudent("x", "stu-1")).rejects.toThrow(ApiError);
  });

  it("unlinks student from schedule", async () => {
    vi.mocked(repo.findById).mockResolvedValue(mockSchedule as any);
    vi.mocked(repo.unlinkStudent).mockResolvedValue(undefined);
    const result = await service.unlinkStudent("sched-1", "stu-1");
    expect(result).toEqual({ schedule_id: "sched-1", student_id: "stu-1", unlinked: true });
  });
});
