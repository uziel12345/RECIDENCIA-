import { buildingEntrances } from "../data/buildingEntrances";
import findPath from "./pathfinding";

type BuildingEntrance = {
  buildingId: string;
  nodeId?: string;
  entranceNodeId?: string;
  node?: string;
};

function getEntranceNodeId(buildingId: string): string | null {
  const entry = (buildingEntrances as BuildingEntrance[]).find(
    (e) => e.buildingId === buildingId
  );

  if (!entry) {
    return null;
  }

  if (typeof entry.nodeId === "string" && entry.nodeId.length > 0) {
    return entry.nodeId;
  }

  if (
    typeof entry.entranceNodeId === "string" &&
    entry.entranceNodeId.length > 0
  ) {
    return entry.entranceNodeId;
  }

  if (typeof entry.node === "string" && entry.node.length > 0) {
    return entry.node;
  }

  return null;
}

export function findRouteBetweenBuildings(
  originBuildingId: string,
  destinationBuildingId: string
) {
  const startNodeId = getEntranceNodeId(originBuildingId);
  const endNodeId = getEntranceNodeId(destinationBuildingId);

  if (!startNodeId || !endNodeId) {
    console.warn("No se encontraron nodos para la ruta");
    return [];
  }

  return findPath(startNodeId, endNodeId);
}