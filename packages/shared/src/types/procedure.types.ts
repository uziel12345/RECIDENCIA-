export type ProcedureKind = "tramite" | "servicio";
export type ProcedureRequirementType = "requisito" | "documento";

export type ProcedureRequirement = {
  id: string;
  procedure_id: string;
  description: string;
  type: ProcedureRequirementType;
  is_mandatory: boolean;
  display_order: number;
};

export type Procedure = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  resource_url: string | null;
  kind: ProcedureKind;
  department_id: string | null;
  department_name: string | null;
  internal_location: string | null;
  schedule_text: string | null;
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

export type ProcedureForAdmin = Procedure & {
  building_count: number;
};

export type CreateProcedureInput = {
  name: string;
  slug: string;
  description?: string | null;
  resource_url?: string | null;
  kind: ProcedureKind;
  department_id?: string | null;
  internal_location?: string | null;
  schedule_text?: string | null;
  is_active?: boolean;
  requirements?: Array<{
    description: string;
    type?: ProcedureRequirementType;
    is_mandatory?: boolean;
    display_order?: number;
  }>;
};

export type UpdateProcedureInput = Partial<CreateProcedureInput>;

export type LinkProcedureInput = {
  procedure_id: string;
  notes?: string | null;
};
