import type { RowDataPacket } from "../../db/mysql-compat-types.js";

export type SearchResultKind =
  | "building"
  | "classroom"
  | "procedure"
  | "service"
  | "department"
  | "cubicle"
  | "headquarters"
  | "gate"
  | "position"
  | "street"
  | "person"
  | "office";

export interface SearchCandidateRow extends RowDataPacket {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  buildingId: string | null;
  buildingName: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  description?: string | null;
  aliasText?: string | null;
  keywordText?: string | null;
  aliases: string[];
  keywords: string[];
  validationStatus?: "confirmed" | "pending_validation";
  x?: number;
  z?: number;
}

export interface SearchResultRow extends SearchCandidateRow {
  score: number;
  coordinates?: { x: number; z: number };
}

export interface GateSearchResultRow extends SearchCandidateRow {
  x: number;
  z: number;
}

export type SearchResponseRow = {
  query: string;
  normalizedQuery: string;
  results: SearchResultRow[];
  suggestions: string[];
};
