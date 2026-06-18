import { apiDelete, apiGet, apiPost } from "./client.js";
import type {
  CreateProcedureInput,
  LinkProcedureInput,
  Procedure,
  ProcedureForBuilding,
  ProcedureKind,
  ProcedureWithDetails,
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

export function getProceduresByBuildingApi(
  buildingId: string
): Promise<ProcedureForBuilding[]> {
  return apiGet<ProcedureForBuilding[]>(`/buildings/${buildingId}/procedures`);
}

export function createProcedureApi(
  input: CreateProcedureInput
): Promise<ProcedureWithDetails> {
  return apiPost<ProcedureWithDetails, CreateProcedureInput>("/procedures", input);
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
