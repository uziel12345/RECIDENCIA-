import { apiGet } from "./client.js";
import type { StudentLocation, ProfessorLocation } from "../types/academic.types.js";

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
