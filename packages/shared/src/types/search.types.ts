export type SearchResultKind =
  | "building"
  | "classroom"
  | "procedure"
  | "service"
  | "department"
  | "cubicle"
  | "headquarters"
  | "gate";

export type SearchResult = {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  buildingId: string | null;
  buildingName: string | null;
  /** Solo presente en resultados kind="gate" (no pertenecen a un edificio). */
  coordinates?: { x: number; z: number };
};
