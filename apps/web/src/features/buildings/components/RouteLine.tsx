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
import {
  distanceToEstimatedSeconds,
  getNavigationEdgeWeight,
  getNavigationRouteApi,
} from "@ito-map/shared";

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
  totalDistance: number;
  estimatedSeconds: number;
};

// Elevada sobre el modelo para que no quede oculta por techos o superficies 3D.
const ROUTE_HEIGHT_OFFSET = 8;

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
    routePoints: nodePoints,
    userStartPoint,
    endPoint: nodePoints[nodePoints.length - 1] ?? null,
  };
}

export function RouteLine() {
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const setCurrentRouteNodeIds = useBuildingStore(
    (state) => state.setCurrentRouteNodeIds
  );
  const setRouteStats = useBuildingStore((state) => state.setRouteStats);
  const setRouteError = useBuildingStore((state) => state.setRouteError);

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
        weight: getNavigationEdgeWeight(edge),
        bidirectional: edge.is_bidirectional,
      })),
    [edges]
  );

  useEffect(() => {
    let cancelled = false;

    async function calculateRoute() {
      setRouteData(null);

      if (loading || !routeDestination) {
        setCurrentRouteNodeIds([]);
        return;
      }

      if (permission !== "granted") {
        setCurrentRouteNodeIds([]);
        setRouteStats(null);
        setRouteError("Activa el permiso de ubicación para trazar la ruta.");
        return;
      }

      if (!mapPosition) {
        setCurrentRouteNodeIds([]);
        setRouteStats(null);
        setRouteError("Esperando tu ubicación actual para trazar la ruta.");
        return;
      }

      if (nodes.length === 0 || graphEdges.length === 0) {
        setCurrentRouteNodeIds([]);
        setRouteError("No hay datos de navegación disponibles en el servidor.");
        return;
      }

      if (entrances.length === 0) {
        setCurrentRouteNodeIds([]);
        setRouteError("Las entradas de edificios no están configuradas aún.");
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
        setRouteError("No se pudo detectar tu posición en el mapa del campus.");
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
        setRouteError(`${routeDestination.name} no tiene una entrada configurada.`);
        return;
      }

      let pathNodeIds: string[] = [];
      let pathNodes: NavigationNode[] = [];
      let totalDistance = 0;
      let estimatedSeconds = 0;

      try {
        const backendRoute = await getNavigationRouteApi(
          nearestNode.id,
          destinationEntrance.node_id
        );

        pathNodeIds = backendRoute.node_ids;
        pathNodes = backendRoute.nodes;
        totalDistance = backendRoute.total_distance ?? 0;
        estimatedSeconds = backendRoute.estimated_seconds ?? 0;

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

        // Calcular distancia local sumando segmentos
        for (let i = 0; i < pathNodes.length - 1; i++) {
          const a = pathNodes[i];
          const b = pathNodes[i + 1];
          const dx = Number(a.x) - Number(b.x);
          const dz = Number(a.z) - Number(b.z);
          totalDistance += Math.sqrt(dx * dx + dz * dz);
        }
        estimatedSeconds = distanceToEstimatedSeconds(totalDistance);
      }

      if (cancelled) return;

      if (pathNodeIds.length === 0 || pathNodes.length === 0) {
        console.warn(
          `[RouteLine] Sin ruta de ${nearestNode.id} → ${destinationEntrance.node_id}`
        );
        setCurrentRouteNodeIds([]);
        setRouteStats(null);
        setRouteData(null);
        setRouteError("No se encontró una ruta disponible hacia este edificio.");
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
        setRouteStats(null);
        setRouteData(null);
        return;
      }

      setCurrentRouteNodeIds(pathNodeIds);
      setRouteStats({ totalDistance, estimatedSeconds });
      setRouteError(null);

      setRouteData({
        routeNodeIds: pathNodeIds,
        routePoints,
        userStartPoint,
        endPoint,
        destinationName: routeDestination.name,
        totalDistance,
        estimatedSeconds,
      });

      console.info("[RouteLine] Ruta lista para renderizar", {
        destination: routeDestination.name,
        nearestNode: nearestNode.code,
        destinationNode: destinationEntrance.node_code,
        points: routePoints.length,
        totalDistance,
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
    setRouteStats,
    setRouteError,
  ]);

  if (!routeData) return null;

  // Nodos intermedios del grafo (excluye inicio y fin que ya tienen su propia esfera).
  const waypointPoints = routeData.routePoints.slice(1, -1);

  return (
    <>
      <Line
        points={routeData.routePoints}
        color="#ffffff"
        lineWidth={12}
        transparent
        opacity={0.9}
        depthTest={false}
        renderOrder={20}
      />

      <Line
        points={routeData.routePoints}
        color="#22c55e"
        lineWidth={7}
        transparent
        opacity={1}
        depthTest={false}
        renderOrder={21}
      />

      {waypointPoints.map((point, i) => (
        <mesh key={i} position={point}>
          <sphereGeometry args={[0.45, 12, 12]} />
          <meshStandardMaterial color="#15803d" />
        </mesh>
      ))}

      <mesh position={routeData.routePoints[0] ?? routeData.userStartPoint}>
        <sphereGeometry args={[0.95, 20, 20]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>

      <mesh position={routeData.endPoint}>
        <sphereGeometry args={[0.95, 20, 20]} />
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
