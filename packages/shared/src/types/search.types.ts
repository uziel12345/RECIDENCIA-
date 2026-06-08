export type SearchResultKind = "building" | "classroom" | "procedure" | "service";

export type SearchResult = {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  buildingId: string | null;
  buildingName: string | null;
};
