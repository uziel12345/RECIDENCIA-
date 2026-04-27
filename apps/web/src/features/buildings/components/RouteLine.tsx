import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Html, Line } from "@react-three/drei";

import { useBuildingStore } from "../../../store/building-store";
import { useLocationStore } from "../../../store/location-store";
import {
  getBuildingEntrances,
  getNavigationEdges,
  getNavigationNodes,
  type BuildingEntrance,
  type NavigationEdge,
  type NavigationNode,
} from "../../../services/navigation.service";
import {
  findPathFromEdges,
  type WeightedPathEdge,
} from "../navigation/utils/pathfinding";

type Position3D = {
  x: number;
  y: number;
  z: number;
};

const MAX_EDGE_DISTANCE = 80;

function distance3D(a: Position3D, b: Position3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function findNearestNode(
  position: Position3D,
  nodes: NavigationNode[]
): NavigationNode | null {
  if (nodes.length === 0) {
    return null;
  }

  let nearest: NavigationNode | null = null;
  let minDistance = Infinity;

  for (const node of nodes) {
    const d = distance3D(position, {
      x: Number(node.x),
      y: Number(node.y),
      z: Number(node.z),
    });

    if (d < minDistance) {
      minDistance = d;
      nearest = node;
    }
  }

  return nearest;
}

function isEdgeValid(edge: NavigationEdge, nodes: NavigationNode[]): boolean {
  const from = nodes.find((node) => node.id === edge.from_node_id);
  const to = nodes.find((node) => node.id === edge.to_node_id);

  if (!from || !to) {
    return false;
  }

  const dx = Math.abs(Number(from.x) - Number(to.x));
  const dz = Math.abs(Number(from.z) - Number(to.z));

  if (dx > 40 && dz > 40) {
    return false;
  }

  return true;
}

function getEdgeWeight(edge: NavigationEdge): number {
  let weight = Number(edge.distance);

  if (Number(edge.distance) > 25) {
    weight *= 1.5;
  }

  if (edge.path_type === "outdoor") {
    weight *= 1.2;
  }

  if (edge.path_type === "hallway") {
    weight *= 0.85;
  }

  if (edge.path_type === "stairs") {
    weight *= 3;
  }

  if (edge.path_type === "ramp") {
    weight *= 1.4;
  }

  if (Number(edge.dx) > 10 && Number(edge.dz) > 10) {
    weight *= 1.4;
  }

  return weight;
}

export function RouteLine() {
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const setCurrentRouteNodeIds = useBuildingStore(
    (state) => state.setCurrentRouteNodeIds
  );

  const mapPosition = useLocationStore((state) => state.mapPosition);
  const permission = useLocationStore((state) => state.permission);

  const [nodes, setNodes] = useState<NavigationNode[]>([]);
  const [edges, setEdges] = useState<NavigationEdge[]>([]);
  const [entrances, setEntrances] = useState<BuildingEntrance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNavigation() {
      try {
        const [nodesData, edgesData, entrancesData] = await Promise.all([
          getNavigationNodes(),
          getNavigationEdges(),
          getBuildingEntrances(),
        ]);

        const filteredNodes = nodesData.filter(
          (node) => node.is_active && node.is_walkable
        );

        const filteredEdges = edgesData.filter(
          (edge) =>
            edge.is_active &&
            edge.is_accessible &&
            Number(edge.distance) < MAX_EDGE_DISTANCE &&
            isEdgeValid(edge, filteredNodes)
        );

        const filteredEntrances = entrancesData.filter(
          (entry) => entry.is_accessible
        );

        setNodes(filteredNodes);
        setEdges(filteredEdges);
        setEntrances(filteredEntrances);
      } catch (error) {
        console.error("Error cargando navegación:", error);
      } finally {
        setLoading(false);
      }
    }

    loadNavigation();
  }, []);

  const graphEdges = useMemo<WeightedPathEdge[]>(
    () =>
      edges.map((edge) => ({
        from: edge.from_node_id,
        to: edge.to_node_id,
        weight: getEdgeWeight(edge),
        bidirectional: edge.is_bidirectional,
      })),
    [edges]
  );

  const routeData = useMemo(() => {
    if (
      loading ||
      !routeDestination ||
      !mapPosition ||
      permission !== "granted" ||
      nodes.length === 0 ||
      graphEdges.length === 0 ||
      entrances.length === 0
    ) {
      return null;
    }

    const nearestNode = findNearestNode(
      {
        x: mapPosition.x,
        y: mapPosition.y,
        z: mapPosition.z,
      },
      nodes
    );

    if (!nearestNode) {
      console.warn("No se encontró nodo cercano al usuario.");
      return null;
    }

    const destinationEntrance =
      entrances.find(
        (entry) =>
          entry.building_id === routeDestination.id && entry.is_primary
      ) ??
      entrances.find((entry) => entry.building_id === routeDestination.id) ??
      null;

    if (!destinationEntrance) {
      console.warn("No se encontró entrada para el edificio destino.");
      return null;
    }

    const pathNodeIds = findPathFromEdges(
      nearestNode.id,
      destinationEntrance.node_id,
      graphEdges
    );

    if (pathNodeIds.length === 0) {
      console.warn("No se encontró ruta entre los nodos.");
      return null;
    }

    const pathNodes = pathNodeIds
      .map((nodeId) => nodes.find((node) => node.id === nodeId) ?? null)
      .filter(Boolean) as NavigationNode[];

    if (pathNodes.length === 0) {
      return null;
    }

    const userStartPoint = new THREE.Vector3(
      mapPosition.x,
      mapPosition.y + 2,
      mapPosition.z
    );

    const nodePoints = pathNodes.map(
      (node) =>
        new THREE.Vector3(
          Number(node.x),
          Number(node.y) + 2,
          Number(node.z)
        )
    );

    const routePoints = [userStartPoint, ...nodePoints];

    if (routePoints.length < 2) {
      return null;
    }

    return {
      routeNodeIds: pathNodeIds,
      routePoints,
      userStartPoint,
      endPoint: nodePoints[nodePoints.length - 1],
      destinationName: routeDestination.name,
    };
  }, [
    loading,
    routeDestination,
    mapPosition,
    permission,
    nodes,
    graphEdges,
    entrances,
  ]);

  useEffect(() => {
    if (!routeData) {
      setCurrentRouteNodeIds([]);
      return;
    }

    setCurrentRouteNodeIds(routeData.routeNodeIds);
  }, [routeData, setCurrentRouteNodeIds]);

  if (!routeData) {
    return null;
  }

  return (
    <>
      <Line points={routeData.routePoints} color="#22c55e" lineWidth={4} />

      <mesh position={routeData.userStartPoint}>
        <sphereGeometry args={[1.2, 20, 20]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>

      <mesh position={routeData.endPoint}>
        <sphereGeometry args={[1.2, 20, 20]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      <Html
        position={[
          routeData.userStartPoint.x,
          routeData.userStartPoint.y + 2.5,
          routeData.userStartPoint.z,
        ]}
        center
      >
        <div
          style={{
            background: "rgba(34, 197, 94, 0.94)",
            color: "#ffffff",
            padding: "6px 10px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
          }}
        >
          Inicio, tu ubicación
        </div>
      </Html>

      <Html
        position={[
          routeData.endPoint.x,
          routeData.endPoint.y + 2.5,
          routeData.endPoint.z,
        ]}
        center
      >
        <div
          style={{
            background: "rgba(239, 68, 68, 0.94)",
            color: "#ffffff",
            padding: "6px 10px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
          }}
        >
          Destino, {routeData.destinationName}
        </div>
      </Html>
    </>
  );
}