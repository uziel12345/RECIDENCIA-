import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client.js";
import type {
  CreateProcedureInput,
  LinkProcedureInput,
  Procedure,
  ProcedureForAdmin,
  ProcedureForBuilding,
  ProcedureKind,
  ProcedureWithDetails,
  UpdateProcedureInput,
} from "../types/procedure.types.js";

export function getProceduresApi(opts?: {
  kind?: ProcedureKind;
  buildingId?: string;
}): Promise<Procedure[]> {
  const params = new URLSearchParams();
  if (opts?.kind) params.set("kind", opts.kind);
  if (opts?.buildingId) params.set("buildingId", opts.buildingId);
  const query = params.toString();
  return apiGet<Procedure[]>(`/procedures${query ? `?${query}` : ""}`);
}

export function getProceduresForAdminApi(opts?: {
  kind?: ProcedureKind;
}): Promise<ProcedureForAdmin[]> {
  const params = new URLSearchParams();
  if (opts?.kind) params.set("kind", opts.kind);
  const query = params.toString();
  return apiGet<ProcedureForAdmin[]>(`/procedures/admin/all${query ? `?${query}` : ""}`);
}

export function getProcedureByIdApi(id: string): Promise<ProcedureWithDetails> {
  return apiGet<ProcedureWithDetails>(`/procedures/${id}`);
}

export function getProceduresByBuildingApi(
  buildingId: string
): Promise<ProcedureForBuilding[]> {
  return apiGet<ProcedureForBuilding[]>(`/buildings/${buildingId}/procedures`);
}

export function getServicesByBuildingApi(
  buildingId: string
): Promise<ProcedureForBuilding[]> {
  return apiGet<ProcedureForBuilding[]>(`/buildings/${buildingId}/services`);
}

export function createProcedureApi(
  input: CreateProcedureInput
): Promise<ProcedureWithDetails> {
  return apiPost<ProcedureWithDetails, CreateProcedureInput>("/procedures", input);
}

export function updateProcedureApi(
  id: string,
  input: UpdateProcedureInput
): Promise<ProcedureWithDetails> {
  return apiPut<ProcedureWithDetails, UpdateProcedureInput>(`/procedures/${id}`, input);
}

export function updateProcedureStatusApi(
  id: string,
  is_active: boolean
): Promise<ProcedureWithDetails> {
  return apiPatch<ProcedureWithDetails, { is_active: boolean }>(
    `/procedures/${id}/status`,
    { is_active }
  );
}

export function deleteProcedureApi(
  id: string
): Promise<{ id: string; deleted: boolean }> {
  return apiDelete<{ id: string; deleted: boolean }>(`/procedures/${id}`);
}

export function linkProcedureToBuildingApi(
  buildingId: string,
  input: LinkProcedureInput
): Promise<ProcedureForBuilding> {
  return apiPost<ProcedureForBuilding, LinkProcedureInput>(
    `/buildings/${buildingId}/procedures`,
    input
  );
}

export function unlinkProcedureFromBuildingApi(
  buildingId: string,
  procedureId: string
): Promise<{ id: string; unlinked: boolean }> {
  return apiDelete<{ id: string; unlinked: boolean }>(
    `/buildings/${buildingId}/procedures/${procedureId}`
  );
}
