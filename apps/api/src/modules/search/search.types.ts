import type { RowDataPacket } from "mysql2";

export type SearchResultKind = "building" | "classroom" | "procedure" | "service";

export interface SearchResultRow extends RowDataPacket {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  buildingId: string | null;
  buildingName: string | null;
}
