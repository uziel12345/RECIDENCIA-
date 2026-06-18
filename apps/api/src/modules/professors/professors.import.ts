import { inflateRawSync } from "node:zlib";
import { ApiError } from "../../shared/errors/api-error.js";

export type ProfessorScheduleImportRow = Record<string, string>;

const REQUIRED_COLUMNS = [
  "rfc",
  "docente",
  "periodo",
  "materia",
  "nombre_materia",
  "grupo",
  "carrera",
  "carrera_nombre",
] as const;

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function columnIndex(ref: string): number {
  const letters = ref.replace(/\d+/g, "").toUpperCase();
  let total = 0;
  for (const letter of letters) {
    total = total * 26 + letter.charCodeAt(0) - 64;
  }
  return total - 1;
}

function getZipEntries(buffer: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  const eocdSignature = 0x06054b50;
  let eocdOffset = -1;

  for (let i = buffer.length - 22; i >= 0; i -= 1) {
    if (buffer.readUInt32LE(i) === eocdSignature) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) throw new ApiError(400, "El archivo Excel no es valido.");

  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  let offset = centralDirectoryOffset;
  const end = centralDirectoryOffset + centralDirectorySize;

  while (offset < end) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;

    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer
      .subarray(offset + 46, offset + 46 + fileNameLength)
      .toString("utf8");

    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

    if (method === 0) {
      entries.set(name, compressed);
    } else if (method === 8) {
      entries.set(name, inflateRawSync(compressed));
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function readSharedStrings(xml: string | undefined): string[] {
  if (!xml) return [];
  const strings: string[] = [];
  const siMatches = xml.matchAll(/<si\b[\s\S]*?<\/si>/g);

  for (const match of siMatches) {
    const textParts = [...match[0].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((part) =>
      decodeXml(part[1] ?? "")
    );
    strings.push(textParts.join(""));
  }

  return strings;
}

function readCellValue(cellXml: string, sharedStrings: string[]): string {
  const type = cellXml.match(/\bt="([^"]+)"/)?.[1];

  if (type === "inlineStr") {
    const inlineText = [...cellXml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((match) => decodeXml(match[1] ?? ""))
      .join("");
    return inlineText.trim();
  }

  const value = cellXml.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
  if (type === "s") return (sharedStrings[Number(value)] ?? "").trim();
  return decodeXml(value).trim();
}

function parseWorksheet(xml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = [];

  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const ref = cellMatch[1]?.match(/\br="([^"]+)"/)?.[1];
      if (!ref) continue;
      row[columnIndex(ref)] = readCellValue(cellMatch[0], sharedStrings);
    }
    rows.push(row.map((value) => value ?? ""));
  }

  return rows;
}

function findImportHeader(rows: string[][]): { index: number; headers: string[]; missing: string[] } {
  let best = {
    index: -1,
    headers: [] as string[],
    missing: [...REQUIRED_COLUMNS] as string[],
  };

  rows.forEach((row, index) => {
    if (!row.some((cell) => cell.trim())) return;
    const headers = row.map((cell) => cell.trim().toLowerCase());
    const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
    if (missing.length < best.missing.length) {
      best = { index, headers, missing };
    }
  });

  return best;
}

function rowsToImportRecords(
  rows: string[][],
  headerRowIndex: number,
  headers: string[]
): ProfessorScheduleImportRow[] {
  return rows.slice(headerRowIndex + 1).flatMap((row) => {
    const record: ProfessorScheduleImportRow = {};
    headers.forEach((header, index) => {
      if (header) record[header] = (row[index] ?? "").trim();
    });
    return Object.values(record).some(Boolean) ? [record] : [];
  });
}

function worksheetSortValue(path: string): number {
  if (path === "xl/worksheets/sheet2.xml") return 0;
  if (path === "xl/worksheets/sheet1.xml") return 1;
  const sheetNumber = Number(path.match(/sheet(\d+)\.xml$/)?.[1] ?? Number.MAX_SAFE_INTEGER);
  return sheetNumber + 10;
}

export function parseProfessorScheduleWorkbook(buffer: Buffer): ProfessorScheduleImportRow[] {
  const entries = getZipEntries(buffer);
  const sharedStrings = readSharedStrings(entries.get("xl/sharedStrings.xml")?.toString("utf8"));
  const worksheetPaths = [...entries.keys()]
    .filter((path) => /^xl\/worksheets\/sheet\d+\.xml$/.test(path))
    .sort((a, b) => worksheetSortValue(a) - worksheetSortValue(b));

  let bestMissing = [...REQUIRED_COLUMNS] as string[];

  for (const path of worksheetPaths) {
    const worksheet = entries.get(path);
    if (!worksheet) continue;

    const rows = parseWorksheet(worksheet.toString("utf8"), sharedStrings);
    const header = findImportHeader(rows);
    if (header.missing.length < bestMissing.length) bestMissing = header.missing;
    if (header.index === -1 || header.missing.length > 0) continue;

    return rowsToImportRecords(rows, header.index, header.headers);
  }

  throw new ApiError(400, `Faltan columnas requeridas: ${bestMissing.join(", ")}`);
}

export function parseScheduleTimeRange(value: string): { start_time: string; end_time: string } | null {
  const normalized = value.replace(/\s+/g, " ").trim();
  const match = normalized.match(/(\d{1,2}):?(\d{2})\s*(?:-|–|—|a|A)\s*(\d{1,2}):?(\d{2})/);
  if (!match) return null;

  const startHour = Number(match[1]);
  const startMinute = Number(match[2]);
  const endHour = Number(match[3]);
  const endMinute = Number(match[4]);
  if (
    startHour > 23 ||
    endHour > 23 ||
    startMinute > 59 ||
    endMinute > 59 ||
    startHour * 60 + startMinute >= endHour * 60 + endMinute
  ) {
    return null;
  }

  return {
    start_time: `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`,
    end_time: `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}:00`,
  };
}
