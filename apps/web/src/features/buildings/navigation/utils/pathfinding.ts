import {
  getNavigationEdgeWeight,
  type NavigationEdge,
  type NavigationNode,
} from "@ito-map/shared";
import type { Building } from "../../types/building";

export type AdjEdge = { nodeId: string; weight: number };
export type AdjMap = Map<string, AdjEdge[]>;

export type BuildingObstacle = {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
};

export function getObstacleRadius(building: Building): number {
  const category = building.category_code?.toLowerCase?.() ?? "";
  const name = building.name.toLowerCase();

  if (name.includes("gimnasio") || name.includes("biblioteca")) return 24;
  if (category.includes("aula")) return 18;
  if (category.includes("laboratorio")) return 20;
  if (category.includes("servicio")) return 13;

  return 16;
}

export function buildBuildingObstacles(buildings: Building[]): BuildingObstacle[] {
  return buildings
    .filter((building) => building.is_active)
    .filter((building) => building.x !== null && building.z !== null)
    .map((building) => ({
      id: building.id,
      name: building.name,
      x: Number(building.x),
      z: Number(building.z),
      radius: getObstacleRadius(building),
    }))
    .filter((obstacle) => Number.isFinite(obstacle.x) && Number.isFinite(obstacle.z));
}

export function distancePointToSegmentSq(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number
): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;

  if (lenSq === 0) return (px - ax) ** 2 + (pz - az) ** 2;

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lenSq));
  const cx = ax + t * dx;
  const cz = az + t * dz;

  return (px - cx) ** 2 + (pz - cz) ** 2;
}

export function edgeCrossesBuilding(
  from: NavigationNode,
  to: NavigationNode,
  obstacles: BuildingObstacle[]
): boolean {
  for (const obstacle of obstacles) {
    const fromDist = Math.hypot(from.x - obstacle.x, from.z - obstacle.z);
    const toDist = Math.hypot(to.x - obstacle.x, to.z - obstacle.z);

    if (fromDist < obstacle.radius * 0.45 || toDist < obstacle.radius * 0.45) {
      continue;
    }

    const distanceSq = distancePointToSegmentSq(
      obstacle.x,
      obstacle.z,
      from.x,
      from.z,
      to.x,
      to.z
    );

    if (distanceSq < obstacle.radius * obstacle.radius) {
      return true;
    }
  }

  return false;
}

export function getObstaclePenalty(
  from: NavigationNode,
  to: NavigationNode,
  obstacles: BuildingObstacle[]
): number {
  return edgeCrossesBuilding(from, to, obstacles) ? 4 : 1;
}

export function buildAdjacency(
  edges: NavigationEdge[],
  nodeById: Map<string, NavigationNode>,
  obstacles: BuildingObstacle[]
): AdjMap {
  const adj: AdjMap = new Map();

  for (const edge of edges) {
    const fromNode = nodeById.get(edge.from_node_id);
    const toNode = nodeById.get(edge.to_node_id);

    if (!fromNode || !toNode) continue;
    const w = getNavigationEdgeWeight(edge) * getObstaclePenalty(fromNode, toNode, obstacles);

    if (!adj.has(edge.from_node_id)) adj.set(edge.from_node_id, []);
    adj.get(edge.from_node_id)!.push({ nodeId: edge.to_node_id, weight: w });

    if (edge.is_bidirectional) {
      if (!adj.has(edge.to_node_id)) adj.set(edge.to_node_id, []);
      adj.get(edge.to_node_id)!.push({ nodeId: edge.from_node_id, weight: w });
    }
  }

  return adj;
}

export class MinHeap {
  private heap: Array<{ nodeId: string; f: number }> = [];

  get size() {
    return this.heap.length;
  }

  push(nodeId: string, f: number): void {
    this.heap.push({ nodeId, f });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): { nodeId: string; f: number } | null {
    if (this.heap.length === 0) return null;
    const top = this.heap[0]!;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent]!.f <= this.heap[i]!.f) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i]!, this.heap[parent]!];
      i = parent;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let min = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.heap[l]!.f < this.heap[min]!.f) min = l;
      if (r < n && this.heap[r]!.f < this.heap[min]!.f) min = r;
      if (min === i) break;
      [this.heap[i], this.heap[min]] = [this.heap[min]!, this.heap[i]!];
      i = min;
    }
  }
}

export function h(a: NavigationNode, b: NavigationNode): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function aStar(
  startId: string,
  goalId: string,
  nodeById: Map<string, NavigationNode>,
  adjacency: AdjMap
): string[] | null {
  if (startId === goalId) return [startId];

  const goal = nodeById.get(goalId);
  const start = nodeById.get(startId);
  if (!goal || !start) return null;

  const open = new MinHeap();
  const gCost = new Map<string, number>([[startId, 0]]);
  const parent = new Map<string, string>();
  const closed = new Set<string>();

  open.push(startId, h(start, goal));

  while (open.size > 0) {
    const { nodeId: cur } = open.pop()!;

    if (cur === goalId) break;
    if (closed.has(cur)) continue;
    closed.add(cur);

    const g = gCost.get(cur) ?? Infinity;

    for (const edge of adjacency.get(cur) ?? []) {
      if (closed.has(edge.nodeId)) continue;
      const tentG = g + edge.weight;
      if (tentG >= (gCost.get(edge.nodeId) ?? Infinity)) continue;

      gCost.set(edge.nodeId, tentG);
      parent.set(edge.nodeId, cur);

      const neighbor = nodeById.get(edge.nodeId);
      open.push(edge.nodeId, tentG + (neighbor ? h(neighbor, goal) : 0));
    }
  }

  if (!parent.has(goalId)) return null;

  const path = [goalId];
  let cursor = goalId;
  while (cursor !== startId) {
    const prev = parent.get(cursor);
    if (!prev) return null;
    path.unshift(prev);
    cursor = prev;
  }
  return path;
}

export function snapToNearest(
  x: number,
  z: number,
  nodes: NavigationNode[]
): NavigationNode | null {
  let nearest: NavigationNode | null = null;
  let nearestSq = Infinity;

  for (const node of nodes) {
    const sq = (node.x - x) ** 2 + (node.z - z) ** 2;
    if (sq < nearestSq) {
      nearest = node;
      nearestSq = sq;
    }
  }

  return nearest;
}
