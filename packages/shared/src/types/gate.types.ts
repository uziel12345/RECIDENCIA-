export type GateAccessType = "peatonal" | "vehicular" | "mixto";
export type GateStatus = "abierta" | "cerrada" | "solo_entrada" | "solo_salida";

export type Gate = {
  id: string;
  name: string;
  description: string | null;
  access_type: GateAccessType;
  status: GateStatus;
  x: number;
  y: number;
  z: number;
  is_active: boolean;
};

export type CreateGateInput = {
  name: string;
  description?: string | null;
  access_type?: GateAccessType;
  status?: GateStatus;
  x: number;
  y?: number;
  z: number;
  is_active?: boolean;
};

export type UpdateGateInput = Partial<CreateGateInput>;

export type DeleteGateResult = {
  id: string;
  deleted: boolean;
};
