export type ProcedureKind = "tramite" | "servicio";

export type ProcedureRequirement = {
  id: string;
  procedure_id: string;
  description: string;
  is_mandatory: boolean;
  display_order: number;
};

export type Procedure = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  kind: ProcedureKind;
  is_active: boolean;
};

export type ProcedureBuilding = {
  id: string;
  code: string;
  name: string;
  notes: string | null;
};

export type ProcedureWithDetails = Procedure & {
  requirements: ProcedureRequirement[];
  buildings: ProcedureBuilding[];
};

export type ProcedureForBuilding = Procedure & {
  notes: string | null;
  requirements: ProcedureRequirement[];
};

export type CreateProcedureInput = {
  name: string;
  slug: string;
  description?: string | null;
  kind: ProcedureKind;
  is_active?: boolean;
  requirements?: Array<{
    description: string;
    is_mandatory?: boolean;
    display_order?: number;
  }>;
};

export type UpdateProcedureInput = Partial<CreateProcedureInput>;

export type LinkProcedureInput = {
  procedure_id: string;
  notes?: string | null;
};
