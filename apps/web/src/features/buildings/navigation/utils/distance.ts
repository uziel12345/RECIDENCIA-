import type { CampusNode } from "../types/campus-node";

export function getDistanceBetweenNodes(a: CampusNode, b: CampusNode): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}