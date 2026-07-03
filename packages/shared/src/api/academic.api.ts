import { apiGet, apiUpload } from "./client.js";
import type {
  Schedule,
  StudentLocation,
  ProfessorLocation,
  ProfessorLocationSearch,
  ProfessorScheduleImportResult,
} from "../types/academic.types.js";

export function getStudentLocationApi(
  controlNumber: string,
  opts?: { period?: string; at?: string }
): Promise<StudentLocation> {
  const params = new URLSearchParams();
  if (opts?.period) params.set("period", opts.period);
  if (opts?.at) params.set("at", opts.at);
  const qs = params.toString();
  return apiGet<StudentLocation>(
    `/students/${encodeURIComponent(controlNumber)}/location${qs ? `?${qs}` : ""}`
  );
}

export function getProfessorLocationApi(
  employeeNumber: string,
  opts?: { period?: string; at?: string }
): Promise<ProfessorLocation> {
  const params = new URLSearchParams();
  if (opts?.period) params.set("period", opts.period);
  if (opts?.at) params.set("at", opts.at);
  const qs = params.toString();
  return apiGet<ProfessorLocation>(
    `/professors/${encodeURIComponent(employeeNumber)}/location${qs ? `?${qs}` : ""}`
  );
}

export function searchProfessorLocationApi(
  q: string,
  opts?: { period?: string; at?: string }
): Promise<ProfessorLocationSearch> {
  const params = new URLSearchParams();
  params.set("q", q);
  if (opts?.period) params.set("period", opts.period);
  if (opts?.at) params.set("at", opts.at);
  return apiGet<ProfessorLocationSearch>(`/professors/location/search?${params.toString()}`);
}

export function getStudentSchedulesApi(
  controlNumber: string,
  opts?: { period?: string }
): Promise<Schedule[]> {
  const params = new URLSearchParams();
  if (opts?.period) params.set("period", opts.period);
  const qs = params.toString();
  return apiGet<Schedule[]>(
    `/students/${encodeURIComponent(controlNumber)}/schedules${qs ? `?${qs}` : ""}`
  );
}

export function importProfessorSchedulesApi(file: File): Promise<ProfessorScheduleImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<ProfessorScheduleImportResult>("/professors/import-schedules", formData);
}
