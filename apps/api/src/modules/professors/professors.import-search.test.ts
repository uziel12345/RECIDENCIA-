import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfessorsService } from "./professors.service.js";
import { ProfessorsRepository } from "./professors.repository.js";
import { parseProfessorScheduleWorkbook } from "./professors.import.js";

vi.mock("./professors.repository.js");

const professor = {
  id: "prof-1",
  employee_number: "HEGL800101AB1",
  rfc: "HEGL800101AB1",
  full_name: "Dr. Luis Hernandez",
  email: null,
  department: "Sistemas",
  is_active: 1,
  deleted_at: null,
};

const schedule = {
  schedule_id: "sched-1",
  subject: "Programacion",
  subject_code: "ISC-101",
  subject_name: "Programacion",
  group_code: "A",
  career_code: "ISC",
  career_name: "Ingenieria en Sistemas",
  day_of_week: 1,
  start_time: "07:00",
  end_time: "09:00",
  period: "2026-1",
  classroom_id: "classroom-1",
  classroom_code: "B-201",
  classroom_name: "Lab 201",
  classroom_floor: 2,
  building_id: "building-1",
  building_code: "B",
  building_name: "Edificio B",
};

describe("ProfessorsService import/search", () => {
  let service: ProfessorsService;
  let repo: ProfessorsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new ProfessorsRepository();
    service = new ProfessorsService(repo);
  });

  it("parses professor schedule imports and warns for missing classrooms", async () => {
    vi.mocked(repo.upsertImportedProfessor).mockResolvedValue(professor as any);
    vi.mocked(repo.findClassroomByCode)
      .mockResolvedValueOnce({ id: "classroom-1" })
      .mockResolvedValueOnce(null);
    vi.mocked(repo.createImportedSchedule).mockResolvedValue("sched-1");

    const result = await service.importSchedules(createWorkbookBuffer());

    expect(repo.upsertImportedProfessor).toHaveBeenCalledWith(
      expect.objectContaining({ rfc: "HEGL800101AB1" })
    );
    expect(repo.createImportedSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        subject_code: "ISC-101",
        subject_name: "Programacion",
        group_code: "A",
        career_code: "ISC",
        career_name: "Ingenieria en Sistemas",
        start_time: "07:00:00",
        end_time: "09:00:00",
      })
    );
    expect(result.schedules_created).toBe(1);
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("NOPE")])
    );
  });

  it("searches by RFC before professor name", async () => {
    vi.mocked(repo.findByRfc).mockResolvedValue(professor as any);
    vi.mocked(repo.findSchedulesForProfessor).mockResolvedValue([schedule as any]);

    const result = await service.searchLocation("hegl800101ab1", "2026-1", "08:00");

    expect(repo.findByName).not.toHaveBeenCalled();
    expect(repo.findSchedulesForProfessor).toHaveBeenCalledWith("prof-1", {
      period: "2026-1",
      at: "08:00:00",
    });
    expect(result.professor?.rfc).toBe("HEGL800101AB1");
    expect(result.schedules[0].schedule.subject_name).toBe("Programacion");
  });

  it("searches by professor name when RFC has no exact match", async () => {
    vi.mocked(repo.findByRfc).mockResolvedValue(null);
    vi.mocked(repo.findByName).mockResolvedValue([professor as any]);
    vi.mocked(repo.findSchedulesForProfessor).mockResolvedValue([]);

    const result = await service.searchLocation("Luis");

    expect(repo.findByName).toHaveBeenCalledWith("Luis");
    expect(result.professor?.full_name).toBe("Dr. Luis Hernandez");
    expect(result.candidates).toEqual([]);
  });

  it("returns candidates when name search has multiple matches", async () => {
    vi.mocked(repo.findByRfc).mockResolvedValue(null);
    vi.mocked(repo.findByName).mockResolvedValue([
      professor as any,
      { ...professor, id: "prof-2", rfc: "PEGL800101AB1", full_name: "Luis Perez" } as any,
    ]);

    const result = await service.searchLocation("Luis");

    expect(repo.findSchedulesForProfessor).not.toHaveBeenCalled();
    expect(result.candidates).toHaveLength(2);
    expect(result.schedules).toEqual([]);
  });
});

describe("parseProfessorScheduleWorkbook", () => {
  it("rejects malformed and oversized ZIP metadata before decompression", () => {
    expect(() => parseProfessorScheduleWorkbook(Buffer.from("not-a-zip"))).toThrow(
      "no es válido"
    );

    const forged = Buffer.from(zipStore({ "xl/worksheets/sheet1.xml": createValidSheetXml() }));
    const centralOffset = forged.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    forged.writeUInt32LE(11 * 1024 * 1024, centralOffset + 24);
    expect(() => parseProfessorScheduleWorkbook(forged)).toThrow("excede los límites");
  });

  it("falls back to sheet1 when sheet2 has no required columns", () => {
    const rows = parseProfessorScheduleWorkbook(
      zipStore({
        "xl/worksheets/sheet1.xml": createValidSheetXml(),
        "xl/worksheets/sheet2.xml": createSheetXml(["otra_columna"], ["valor"]),
      })
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].rfc).toBe("hegl800101ab1");
  });

  it("uses any worksheet that contains the required columns", () => {
    const rows = parseProfessorScheduleWorkbook(
      zipStore({
        "xl/worksheets/sheet1.xml": createSheetXml(["otra_columna"], ["valor"]),
        "xl/worksheets/sheet2.xml": "<?xml version=\"1.0\"?><worksheet><sheetData /></worksheet>",
        "xl/worksheets/sheet4.xml": createValidSheetXml(),
      })
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].docente).toBe("Dr. Luis Hernandez");
  });

  it("throws a 400 when no worksheet has the required columns", () => {
    expect(() =>
      parseProfessorScheduleWorkbook(
        zipStore({
          "xl/worksheets/sheet1.xml": createSheetXml(["rfc", "docente"], ["x", "y"]),
          "xl/worksheets/sheet2.xml": createSheetXml(["periodo"], ["2026-1"]),
        })
      )
    ).toThrow("Faltan columnas requeridas");
  });
});

function createWorkbookBuffer(): Buffer {
  const headers = [
    "rfc",
    "docente",
    "periodo",
    "materia",
    "nombre_materia",
    "grupo",
    "carrera",
    "carrera_nombre",
    "lunes",
    "lunes_aula",
    "martes",
    "martes_aula",
  ];
  const values = [
    "hegl800101ab1",
    "Dr. Luis Hernandez",
    "2026-1",
    "ISC-101",
    "Programacion",
    "A",
    "ISC",
    "Ingenieria en Sistemas",
    "07:00-09:00",
    "B-201",
    "09:00-11:00",
    "NOPE",
  ];
  const sheet2 = createSheetXml(headers, values);

  return zipStore({
    "xl/worksheets/sheet1.xml": "<?xml version=\"1.0\"?><worksheet><sheetData /></worksheet>",
    "xl/worksheets/sheet2.xml": sheet2,
  });
}

function createValidSheetXml(): string {
  return createSheetXml(
    [
      "rfc",
      "docente",
      "periodo",
      "materia",
      "nombre_materia",
      "grupo",
      "carrera",
      "carrera_nombre",
    ],
    [
      "hegl800101ab1",
      "Dr. Luis Hernandez",
      "2026-1",
      "ISC-101",
      "Programacion",
      "A",
      "ISC",
      "Ingenieria en Sistemas",
    ]
  );
}

function createSheetXml(headers: string[], values: string[]): string {
  const headerCells = headers.map((value, index) => cell(index, 1, value)).join("");
  const valueCells = values.map((value, index) => cell(index, 2, value)).join("");
  return `<?xml version="1.0"?><worksheet><sheetData><row r="1">${headerCells}</row><row r="2">${valueCells}</row></sheetData></worksheet>`;
}

function cell(index: number, row: number, value: string): string {
  const column = String.fromCharCode(65 + index);
  return `<c r="${column}${row}" t="inlineStr"><is><t>${value}</t></is></c>`;
}

function zipStore(files: Record<string, string>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBuffer = Buffer.from(name);
    const data = Buffer.from(content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    localParts.push(local, nameBuffer, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBuffer);
    offset += local.length + nameBuffer.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const fileCount = Object.keys(files).length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(fileCount, 8);
  eocd.writeUInt16LE(fileCount, 10);
  eocd.writeUInt32LE(centralDirectory.length, 12);
  eocd.writeUInt32LE(offset, 16);

  return Buffer.concat([...localParts, centralDirectory, eocd]);
}
