import type { RowDataPacket } from "../../db/mysql-compat-types.js";

export type SearchResultKind =
  | "building"
  | "classroom"
  | "procedure"
  | "service"
  | "department"
  | "cubicle"
  | "headquarters"
  | "gate";

export interface SearchResultRow extends RowDataPacket {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  buildingId: string | null;
  buildingName: string | null;
  coordinates?: { x: number; z: number };
}

export interface GateSearchResultRow extends SearchResultRow {
  x: number;
  z: number;
}
