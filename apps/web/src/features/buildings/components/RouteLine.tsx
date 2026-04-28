/**
 * RouteLine.tsx
 *
 * Renderiza la línea de ruta en el mapa 3D desde la ubicación del usuario
 * hasta el edificio destino, usando los nodos y edges del API.
 *
 * CORRECCIONES APLICADAS:
 * 1. Se eliminó MAX_EDGE_DISTANCE = 80 que descartaba edges válidos (distancias > 80).
 * 2. Se eliminó isEdgeValid que descartaba pasillos largos con dx > 40 y dz > 40.
 * 3. El único filtro válido es is_active + is_accessible, que son datos correctos del API.
 */

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

// ─── Tipos locales ────────────────────────────────────────────────────────────

type Position3D = {
  x: number;
  y: number;
  z: number;
};

// ─── Distancia euclídea 3D ────────────────────────────────────────────────────

function distance3D(a: Position3D, b: Position3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ─── Nodo más cercano a una posición ─────────────────────────────────────────

function findNearestNode(
  position: Position3D,
  nodes: NavigationNode[]
): NavigationNode | null {
  if (nodes.length === 0) return null;

  let nearest: NavigationNode | null = null;
  let minDist = Infinity;

  for (const node of nodes) {
    const d = distance3D(position, {
      x: Number(node.x),
      y: Number(node.y),
      z: Number(node.z),
    });
    if (d < minDist) {
      minDist = d;
      nearest = node;
    }
  }

  return nearest;
}

// ─── Peso del edge según tipo de camino ──────────────────────────────────────
// Se conserva la lógica de pesos original. Solo se eliminaron los filtros
// por distancia máxima que rompían la conectividad del grafo.

function getEdgeWeight(edge: NavigationEdge): number {
  let weight = Number(edge.distance);

  if (edge.path_type === "stairs")   weight *= 3.0;
  if (edge.path_type === "ramp")     weight *= 1.4;
  if (edge.path_type === "outdoor")  weight *= 1.2;
  if (edge.path_type === "hallway")  weight *= 0.85;

  return weight;
}

// ─── Componente principal ────────────────────────────────────────────────────

export function RouteLine() {
  const routeDestination   = useBuildingStore((s) => s.routeDestination);
  const setCurrentRouteNodeIds = useBuildingStore((s) => s.setCurrentRouteNodeIds);

  const mapPosition = useLocationStore((s) => s.mapPosition);
  const permission  = useLocationStore((s) => s.permission);

  const [nodes,     setNodes]     = useState<NavigationNode[]>([]);
  const [edges,     setEdges]     = useState<NavigationEdge[]>([]);
  const [entrances, setEntrances] = useState<BuildingEntrance[]>([]);
  const [loading,   setLoading]   = useState(true);

  // ── Carga de datos del API ─────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [nodesData, edgesData, entrancesData] = await Promise.all([
          getNavigationNodes(),
          getNavigationEdges(),
          getBuildingEntrances(),
        ]);

        // CORRECCIÓN: solo filtramos por is_active e is_walkable/is_accessible.
        // No usamos MAX_EDGE_DISTANCE ni isEdgeValid porque descartaban
        // edges legítimos que son necesarios para conectar el grafo.
        const activeNodes = nodesData.filter(
          (n) => n.is_active && n.is_walkable
        );

        const activeEdges = edgesData.filter(
          (e) => e.is_active && e.is_accessible
        );

        const activeEntrances = entrancesData.filter(
          (e) => e.is_accessible
        );

        setNodes(activeNodes);
        setEdges(activeEdges);
        setEntrances(activeEntrances);
      } catch (err) {
        console.error("Error cargando datos de navegación:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // ── Construcción de edges para Dijkstra ───────────────────────────────────
  const graphEdges = useMemo<WeightedPathEdge[]>(
    () =>
      edges.map((edge) => ({
        from:          edge.from_node_id,
        to:            edge.to_node_id,
        weight:        getEdgeWeight(edge),
        bidirectional: edge.is_bidirectional,
      })),
    [edges]
  );

  // ── Cálculo de la ruta ────────────────────────────────────────────────────
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

    // 1. Nodo más cercano al usuario
    const nearestNode = findNearestNode(
      { x: mapPosition.x, y: mapPosition.y, z: mapPosition.z },
      nodes
    );

    if (!nearestNode) {
      console.warn("[RouteLine] No se encontró nodo cercano al usuario.");
      return null;
    }

    // 2. Entrada principal del edificio destino
    const destinationEntrance =
      entrances.find(
        (e) => e.building_id === routeDestination.id && e.is_primary
      ) ??
      entrances.find((e) => e.building_id === routeDestination.id) ??
      null;

    if (!destinationEntrance) {
      console.warn(
        `[RouteLine] No se encontró entrada para el edificio: ${routeDestination.name}`
      );
      return null;
    }

    // 3. Dijkstra
    const pathNodeIds = findPathFromEdges(
      nearestNode.id,
      destinationEntrance.node_id,
      graphEdges
    );

    if (pathNodeIds.length === 0) {
      console.warn(
        `[RouteLine] Sin ruta de ${nearestNode.id} → ${destinationEntrance.node_id}`
      );
      return null;
    }

    // 4. Convertir IDs a posiciones 3D
    const pathNodes = pathNodeIds
      .map((id) => nodes.find((n) => n.id === id) ?? null)
      .filter(Boolean) as NavigationNode[];

    if (pathNodes.length === 0) return null;
    
    const ROUTE_HEIGHT_OFFSET = 5;

    const userStart = new THREE.Vector3(
      mapPosition.x,
      mapPosition.y + ROUTE_HEIGHT_OFFSET,
      mapPosition.z
    );

    const nodePoints = pathNodes.map(
  (n) =>
    new THREE.Vector3(
      Number(n.x),
      Number(n.y) + ROUTE_HEIGHT_OFFSET,
      Number(n.z)
    )
);
    const routePoints = [userStart, ...nodePoints];
    if (routePoints.length < 2) return null;

    return {
      routeNodeIds:    pathNodeIds,
      routePoints,
      userStartPoint:  userStart,
      endPoint:        nodePoints[nodePoints.length - 1],
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

  // ── Sincronizar IDs de ruta al store ──────────────────────────────────────
  useEffect(() => {
    setCurrentRouteNodeIds(routeData ? routeData.routeNodeIds : []);
  }, [routeData, setCurrentRouteNodeIds]);

  if (!routeData) return null;

  // ── Renderizado ───────────────────────────────────────────────────────────
  return (
    <>
      {/* Línea de ruta */}
      <Line
        points={routeData.routePoints}
        color="#22c55e"
        lineWidth={4}
      />

      {/* Marcador inicio (usuario) */}
      <mesh position={routeData.userStartPoint}>
        <sphereGeometry args={[1.2, 20, 20]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>

      {/* Marcador destino */}
      <mesh position={routeData.endPoint}>
        <sphereGeometry args={[1.2, 20, 20]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      {/* Etiqueta inicio */}
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

      {/* Etiqueta destino */}
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
