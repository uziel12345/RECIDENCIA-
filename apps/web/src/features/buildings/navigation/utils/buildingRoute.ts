import { campusNodes } from "../data/campusNodes";
import { buildingEntrances } from "../data/buildingEntrances";
import findPath from "./pathfinding";

type Position3D = {
  x: number;
  y: number;
  z: number;
};

type CampusNode = {
  id: string;
  x?: number;
  y?: number;
  z?: number;
  position?: {
    x: number;
    y?: number;
    z: number;
  };
};

type BuildingEntrance = {
  buildingId: string;
  nodeId?: string;
  entranceNodeId?: string;
  node?: string;
};

function getNodePosition(node: CampusNode): Position3D | null {
  if (
    typeof node.x === "number" &&
    typeof node.z === "number"
  ) {
    return {
      x: node.x,
      y: typeof node.y === "number" ? node.y : 0,
      z: node.z,
    };
  }

  if (
    node.position &&
    typeof node.position.x === "number" &&
    typeof node.position.z === "number"
  ) {
    return {
      x: node.position.x,
      y: typeof node.position.y === "number" ? node.position.y : 0,
      z: node.position.z,
    };
  }

  return null;
}

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

function findNearestNode(userPosition: Position3D): string | null {
  let closestNodeId: string | null = null;
  let minDistance = Infinity;

  for (const node of campusNodes as CampusNode[]) {
    const pos = getNodePosition(node);

    if (!pos) {
      continue;
    }

    const dx = pos.x - userPosition.x;
    const dz = pos.z - userPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < minDistance) {
      minDistance = distance;
      closestNodeId = node.id;
    }
  }

  return closestNodeId;
}

export function findRouteFromUserToBuilding(
  userPosition: Position3D,
  destinationBuildingId: string
): string[] {
  if (!userPosition) {
    console.warn("No hay posición del usuario.");
    return [];
  }

  const startNodeId = findNearestNode(userPosition);
  const endNodeId = getEntranceNodeId(destinationBuildingId);

  if (!startNodeId || !endNodeId) {
    console.warn("No se pudo calcular la ruta.");
    return [];
  }

  return findPath(startNodeId, endNodeId);
}