import { apiGet } from "./client.ts";
import type {
  BuildingEntrance,
  NavigationEdge,
  NavigationNode,
} from "../types/navigation.types.ts";

export function getNavigationNodesApi(): Promise<NavigationNode[]> {
  return apiGet<NavigationNode[]>("/navigation/nodes");
}

export function getNavigationEdgesApi(): Promise<NavigationEdge[]> {
  return apiGet<NavigationEdge[]>("/navigation/edges");
}

export function getBuildingEntrancesApi(): Promise<BuildingEntrance[]> {
  return apiGet<BuildingEntrance[]>("/navigation/building-entrances");
}