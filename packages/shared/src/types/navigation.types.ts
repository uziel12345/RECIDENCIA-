


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

export type BuildingEntranceType = "main" | "secondary" | "service" | "emergency";

export type BuildingEntrance = {
  id: string;
  building_id: string;
  node_id: string;
  entrance_name: string | null;
  entrance_type: BuildingEntranceType;
  is_primary: boolean;
  is_accessible: boolean;
  building_code: string;
  building_name: string;
  node_code: string;
  node_name: string | null;
  node_x: number;
  node_y: number;
  node_z: number;
};

export type RouteNode = NavigationNode;

export type RouteResult = {
  node_ids: string[];
  nodes: RouteNode[];
  total_distance: number;
  estimated_seconds: number;
};

export type CreateNavigationNodeInput = {
  code?: string;
  name?: string | null;
  node_type: NavigationPathType;
  x: number;
  y?: number;
  z: number;
  floor_level?: number;
  is_walkable?: boolean;
  metadata?: Record<string, unknown> | null;
};

export type CreateNavigationEdgeInput = {
  from_node_id: string;
  to_node_id: string;
  distance?: number;
  path_type?: EdgePathType;
  is_bidirectional?: boolean;
  is_accessible?: boolean;
  metadata?: Record<string, unknown> | null;
};

export type CreateBuildingEntranceInput = {
  building_id: string;
  node_id: string;
  entrance_name?: string | null;
  entrance_type?: BuildingEntranceType;
  is_primary?: boolean;
  is_accessible?: boolean;
};

