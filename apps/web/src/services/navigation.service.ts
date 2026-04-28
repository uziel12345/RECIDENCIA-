import { fetchAPI } from "./api";

export type NavigationPathType =
  | "waypoint"
  | "building_access"
  | "intersection"
  | "poi";

export type EdgePathType =
  | "walkway"
  | "ramp"
  | "stairs"
  | "hallway"
  | "outdoor";

export type NavigationNode = {
  id: string;
  code: string;
  name: string | null;
  node_type: NavigationPathType;
  x: number;
  y: number;
  z: number;
  latitude: number | null;
  longitude: number | null;
  floor_level: number;
  is_walkable: boolean;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
};

export type NavigationEdge = {
  id: string;
  from_node_id: string;
  to_node_id: string;
  distance: number;
  is_bidirectional: boolean;
  is_accessible: boolean;
  path_type: EdgePathType;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  dx: number;
  dz: number;
};

export type BuildingEntrance = {
  id: string;
  building_id: string;
  node_id: string;
  entrance_name: string | null;
  entrance_type: "main" | "secondary" | "service" | "emergency";
  is_primary: boolean;
  is_accessible: boolean;
  building_code: string;
  building_name: string;
  node_code: string;
  node_name: string | null;
};

export async function getNavigationNodes(): Promise<NavigationNode[]> {
  return fetchAPI<NavigationNode[]>("/navigation/nodes");
}

export async function getNavigationEdges(): Promise<NavigationEdge[]> {
  return fetchAPI<NavigationEdge[]>("/navigation/edges");
}

export async function getBuildingEntrances(): Promise<BuildingEntrance[]> {
  return fetchAPI<BuildingEntrance[]>("/navigation/building-entrances");
}