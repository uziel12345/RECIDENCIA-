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

export type SearchValidationStatus = "confirmed" | "pending_validation";

export type SearchResult = {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  buildingId: string | null;
  buildingName: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  description?: string | null;
  aliases: string[];
  keywords: string[];
  score: number;
  validationStatus?: SearchValidationStatus;
  /** Presente en resultados georreferenciados que no pertenecen a un edificio. */
  coordinates?: { x: number; z: number };
};

export type SearchResponse = {
  query: string;
  normalizedQuery: string;
  results: SearchResult[];
  suggestions: string[];
};
