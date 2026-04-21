import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { useBuildingStore } from "../../../store/building-store";
import { findRouteBetweenBuildings } from "../navigation/utils/buildingRoute";
import { campusNodes } from "../navigation/data/campusNodes";

type Node = {
  id: string;
  position?: { x: number; y: number; z: number };
  x?: number;
  y?: number;
  z?: number;
};

function getNodePosition(node: Node) {
  if (node.position) return node.position;
  return {
    x: node.x ?? 0,
    y: node.y ?? 0,
    z: node.z ?? 0,
  };
}

export function RouteLine() {
  const routeOrigin = useBuildingStore((s) => s.routeOrigin);
  const routeDestination = useBuildingStore((s) => s.routeDestination);

  const path = useMemo(() => {
    if (!routeOrigin || !routeDestination) return [];

    return findRouteBetweenBuildings(
      routeOrigin.id,
      routeDestination.id
    );
  }, [routeOrigin, routeDestination]);

 const points = useMemo<[number, number, number][]>(() => {
  if (!path || path.length === 0) return [];

  return path
    .map((nodeId: string) => {
      const node = campusNodes.find((n: Node) => n.id === nodeId);

      if (!node) return null;

      const pos = getNodePosition(node);

      return [pos.x, pos.y + 1, pos.z] as [number, number, number];
    })
    .filter((point): point is [number, number, number] => point !== null);
}, [path]);
  if (points.length < 2) return null;

  return (
    <Line
      points={points}
      color="orange"
      lineWidth={4}
      dashed={false}
    />
  );
}