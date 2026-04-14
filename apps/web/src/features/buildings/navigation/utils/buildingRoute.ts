import { buildingEntrances } from "../data/buildingEntrances";
import { findShortestPath } from "./pathfinding";
import type { CampusNode } from "../types/campus-node";

function getEntranceNodeId(buildingId: string): string | null {
  const entrance = buildingEntrances.find(
    (item) => item.buildingId === buildingId
  );

  return entrance?.nodeId ?? null;
}

export function findRouteBetweenBuildings(
  originBuildingId: string,
  destinationBuildingId: string
): CampusNode[] {
  const originNodeId = getEntranceNodeId(originBuildingId);
  const destinationNodeId = getEntranceNodeId(destinationBuildingId);

  if (!originNodeId || !destinationNodeId) {
    return [];
  }

  return findShortestPath(originNodeId, destinationNodeId);
}