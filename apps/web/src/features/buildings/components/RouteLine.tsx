/**
 * RouteLine.tsx
 *
 * Renderiza la línea de ruta en el mapa 3D desde la ubicación del usuario
 * hasta el edificio destino.
 *
 * Flujo actual:
 * 1. Busca el nodo más cercano al usuario.
 * 2. Busca la entrada del edificio destino.
 * 3. Intenta calcular la ruta desde el backend:
 *    GET /api/navigation/route?fromNodeId=...&toNodeId=...
 * 4. Si el backend falla, usa Dijkstra local como respaldo.
 */

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Html, Line } from "@react-three/drei";
import { getNavigationRouteApi } from "@ito-map/shared";

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

type RouteRenderData = {
  routeNodeIds: string[];
  routePoints: THREE.Vector3[];
  userStartPoint: THREE.Vector3;
  endPoint: THREE.Vector3;
  destinationName: string;
};

// Altura suficiente para que la línea quede visible sobre los techos de los edificios
const ROUTE_HEIGHT_OFFSET = 22;

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
  if (nodes.length === 0) return null;

  let nearest: NavigationNode | null = null;
  let minDist = Infinity;

  for (const node of nodes) {
    const distance = distance3D(position, {
      x: Number(node.x),
      y: Number(node.y),
      z: Number(node.z),
    });

    if (distance < minDist) {
      minDist = distance;
      nearest = node;
    }
  }

  return nearest;
}

function getEdgeWeight(edge: NavigationEdge): number {
  let weight = Number(edge.distance);

  if (edge.path_type === "stairs") weight *= 3.0;
  if (edge.path_type === "ramp") weight *= 1.4;
  if (edge.path_type === "outdoor") weight *= 1.2;
  if (edge.path_type === "hallway") weight *= 0.85;

  return weight;
}

function buildRoutePoints(
  mapPosition: Position3D,
  pathNodes: NavigationNode[]
): {
  routePoints: THREE.Vector3[];
  userStartPoint: THREE.Vector3;
  endPoint: THREE.Vector3 | null;
} {
  const userStartPoint = new THREE.Vector3(
    mapPosition.x,
    mapPosition.y + ROUTE_HEIGHT_OFFSET,
    mapPosition.z
  );

  const nodePoints = pathNodes.map(
    (node) =>
      new THREE.Vector3(
        Number(node.x),
        Number(node.y) + ROUTE_HEIGHT_OFFSET,
        Number(node.z)
      )
  );

  return {
    routePoints: [userStartPoint, ...nodePoints],
    userStartPoint,
    endPoint: nodePoints[nodePoints.length - 1] ?? null,
  };
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
  const [routeData, setRouteData] = useState<RouteRenderData | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadNavigationData() {
      try {
        const [nodesData, edgesData, entrancesData] = await Promise.all([
          getNavigationNodes(),
          getNavigationEdges(),
          getBuildingEntrances(),
        ]);

        if (!mounted) return;

        const activeNodes = nodesData.filter(
          (node) => node.is_active && node.is_walkable
        );

        const activeEdges = edgesData.filter(
          (edge) => edge.is_active && edge.is_accessible
        );

        const activeEntrances = entrancesData.filter(
          (entrance) => entrance.is_accessible
        );

        setNodes(activeNodes);
        setEdges(activeEdges);
        setEntrances(activeEntrances);
      } catch (error) {
        console.error("Error cargando datos de navegación:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadNavigationData();

    return () => {
      mounted = false;
    };
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

  useEffect(() => {
    let cancelled = false;

    async function calculateRoute() {
      setRouteData(null);

      if (
        loading ||
        !routeDestination ||
        !mapPosition ||
        permission !== "granted" ||
        nodes.length === 0 ||
        graphEdges.length === 0 ||
        entrances.length === 0
      ) {
        setCurrentRouteNodeIds([]);
        return;
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
        console.warn("[RouteLine] No se encontró nodo cercano al usuario.");
        setCurrentRouteNodeIds([]);
        return;
      }

      const destinationEntrance =
        entrances.find(
          (entrance) =>
            entrance.building_id === routeDestination.id &&
            entrance.is_primary
        ) ??
        entrances.find(
          (entrance) => entrance.building_id === routeDestination.id
        ) ??
        null;

      if (!destinationEntrance) {
        console.warn(
          `[RouteLine] No se encontró entrada para el edificio: ${routeDestination.name}`
        );
        setCurrentRouteNodeIds([]);
        return;
      }

      let pathNodeIds: string[] = [];
      let pathNodes: NavigationNode[] = [];

      try {
        const backendRoute = await getNavigationRouteApi(
          nearestNode.id,
          destinationEntrance.node_id
        );

        pathNodeIds = backendRoute.node_ids;
        pathNodes = backendRoute.nodes;

        console.info("[RouteLine] Ruta calculada desde backend.");
      } catch (error) {
        console.warn(
          "[RouteLine] No se pudo calcular ruta en backend. Usando Dijkstra local.",
          error
        );

        pathNodeIds = findPathFromEdges(
          nearestNode.id,
          destinationEntrance.node_id,
          graphEdges
        );

        pathNodes = pathNodeIds
          .map((id) => nodes.find((node) => node.id === id) ?? null)
          .filter((node): node is NavigationNode => node !== null);
      }

      if (cancelled) return;

      if (pathNodeIds.length === 0 || pathNodes.length === 0) {
        console.warn(
          `[RouteLine] Sin ruta de ${nearestNode.id} → ${destinationEntrance.node_id}`
        );
        setCurrentRouteNodeIds([]);
        setRouteData(null);
        return;
      }

      const { routePoints, userStartPoint, endPoint } = buildRoutePoints(
        {
          x: mapPosition.x,
          y: mapPosition.y,
          z: mapPosition.z,
        },
        pathNodes
      );

      if (!endPoint || routePoints.length < 2) {
        setCurrentRouteNodeIds([]);
        setRouteData(null);
        return;
      }

      setCurrentRouteNodeIds(pathNodeIds);

      setRouteData({
        routeNodeIds: pathNodeIds,
        routePoints,
        userStartPoint,
        endPoint,
        destinationName: routeDestination.name,
      });
    }

    calculateRoute();

    return () => {
      cancelled = true;
    };
  }, [
    loading,
    routeDestination,
    mapPosition,
    permission,
    nodes,
    graphEdges,
    entrances,
    setCurrentRouteNodeIds,
  ]);

  if (!routeData) return null;

  // Nodos intermedios (excluye inicio y fin que ya tienen su propia esfera)
  const waypointPoints = routeData.routePoints.slice(1, -1);

  return (
    <>
      <Line points={routeData.routePoints} color="#22c55e" lineWidth={4} />

      {waypointPoints.map((point, i) => (
        <mesh key={i} position={point}>
          <sphereGeometry args={[0.7, 12, 12]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
      ))}

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