import { campusNodes } from "../data/campusNodes";

type Position2D = {
  x: number;
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

function getNodePosition(node: CampusNode): Position2D | null {
  if (
    typeof node.x === "number" &&
    typeof node.z === "number"
  ) {
    return {
      x: node.x,
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
      z: node.position.z,
    };
  }

  return null;
}

export function findNearestNode(position: Position2D): string | null {
  let closestNodeId: string | null = null;
  let minDistance = Infinity;

  for (const node of campusNodes as CampusNode[]) {
    const nodePosition = getNodePosition(node);

    if (!nodePosition) {
      continue;
    }

    const dx = nodePosition.x - position.x;
    const dz = nodePosition.z - position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < minDistance) {
      minDistance = distance;
      closestNodeId = node.id;
    }
  }

  return closestNodeId;
}