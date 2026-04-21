import { campusNodes } from "../data/campusNodes";

type NodePosition = {
  x: number;
  y?: number;
  z: number;
};

type CampusNode = {
  id: string;
  x?: number;
  y?: number;
  z?: number;
  position?: NodePosition;
  neighbors?: string[];
};

function getNodePosition(node: CampusNode): NodePosition | null {
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

function distanceBetweenNodes(a: CampusNode, b: CampusNode): number {
  const posA = getNodePosition(a);
  const posB = getNodePosition(b);

  if (!posA || !posB) {
    return Infinity;
  }

  const dx = posA.x - posB.x;
  const dy = (posA.y ?? 0) - (posB.y ?? 0);
  const dz = posA.z - posB.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function buildNodeMap(nodes: CampusNode[]): Map<string, CampusNode> {
  const nodeMap = new Map<string, CampusNode>();

  for (const node of nodes) {
    if (typeof node.id === "string" && node.id.length > 0) {
      nodeMap.set(node.id, node);
    }
  }

  return nodeMap;
}

function reconstructPath(
  previous: Map<string, string | null>,
  endNodeId: string
): string[] {
  const path: string[] = [];
  let current: string | null = endNodeId;

  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) ?? null;
  }

  return path;
}

export default function findPath(
  startNodeId: string,
  endNodeId: string
): string[] {
  if (!startNodeId || !endNodeId) {
    return [];
  }

  if (startNodeId === endNodeId) {
    return [startNodeId];
  }

  const nodes = campusNodes as CampusNode[];
  const nodeMap = buildNodeMap(nodes);

  const startNode = nodeMap.get(startNodeId);
  const endNode = nodeMap.get(endNodeId);

  if (!startNode || !endNode) {
    console.warn("Nodo inicial o final no encontrado en campusNodes.");
    return [];
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  for (const node of nodes) {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
    unvisited.add(node.id);
  }

  distances.set(startNodeId, 0);

  while (unvisited.size > 0) {
    let currentNodeId: string | null = null;
    let currentMinDistance = Infinity;

    for (const nodeId of unvisited) {
      const distance = distances.get(nodeId) ?? Infinity;

      if (distance < currentMinDistance) {
        currentMinDistance = distance;
        currentNodeId = nodeId;
      }
    }

    if (currentNodeId === null) {
      break;
    }

    if (currentNodeId === endNodeId) {
      return reconstructPath(previous, endNodeId);
    }

    unvisited.delete(currentNodeId);

    const currentNode = nodeMap.get(currentNodeId);
    if (!currentNode || !Array.isArray(currentNode.neighbors)) {
      continue;
    }

    for (const neighborId of currentNode.neighbors) {
      if (!unvisited.has(neighborId)) {
        continue;
      }

      const neighborNode = nodeMap.get(neighborId);
      if (!neighborNode) {
        continue;
      }

      const edgeWeight = distanceBetweenNodes(currentNode, neighborNode);
      if (!Number.isFinite(edgeWeight)) {
        continue;
      }

      const tentativeDistance =
        (distances.get(currentNodeId) ?? Infinity) + edgeWeight;

      if (tentativeDistance < (distances.get(neighborId) ?? Infinity)) {
        distances.set(neighborId, tentativeDistance);
        previous.set(neighborId, currentNodeId);
      }
    }
  }

  console.warn("No se encontró una ruta entre los nodos indicados.");
  return [];
}