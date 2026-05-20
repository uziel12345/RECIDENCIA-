import { useEffect, useMemo, useState } from "react";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { useBuildingStore } from "../../store/building-store";
import {
  getBuildingEntrances,
  getNavigationEdges,
  getNavigationNodes,
  type BuildingEntrance,
  type NavigationEdge,
  type NavigationNode,
} from "../../services/navigation.service";

const DEBUG_NODE_Y = 3.2;
const DEBUG_EDGE_Y = 2.4;
const MIN_DIAGONAL_AXIS_DISTANCE = 12;
const MIN_DIAGONAL_EDGE_DISTANCE = 30;
const LONG_EDGE_DISTANCE = 90;

const EDGE_COLORS: Record<string, string> = {
  walkway: "#2563eb",
  hallway: "#16a34a",
  outdoor: "#f59e0b",
  ramp: "#8b5cf6",
  stairs: "#ef4444",
};

function edgeColor(edge: NavigationEdge): string {
  return EDGE_COLORS[edge.path_type] ?? "#64748b";
}

function nodeColor(node: NavigationNode, entrances: BuildingEntrance[]): string {
  const isEntrance = entrances.some((entrance) => entrance.node_id === node.id);

  if (isEntrance) return "#ef4444";
  if (node.node_type === "intersection") return "#f59e0b";
  if (node.node_type === "building_access") return "#ef4444";
  if (node.node_type === "poi") return "#8b5cf6";

  return "#2563eb";
}

type DebugEdge = {
  edge: NavigationEdge;
  points: [THREE.Vector3, THREE.Vector3];
  midpoint: THREE.Vector3;
  distance: number;
  issue: EdgeIssue | null;
};

type NavigationDebugLayerProps = {
  showOnlyIssues?: boolean;
};

type EdgeIssue = {
  severity: "warning" | "danger";
  label: string;
};

function getEdgeIssue(edge: NavigationEdge, distance: number): EdgeIssue | null {
  const dx = Math.abs(Number(edge.dx));
  const dz = Math.abs(Number(edge.dz));
  const isLongDiagonal =
    dx >= MIN_DIAGONAL_AXIS_DISTANCE &&
    dz >= MIN_DIAGONAL_AXIS_DISTANCE &&
    distance >= MIN_DIAGONAL_EDGE_DISTANCE;

  if (isLongDiagonal) {
    return {
      severity: "warning",
      label: "Revisar con plano",
    };
  }

  if (distance >= LONG_EDGE_DISTANCE) {
    return {
      severity: "danger",
      label: "Tramo muy largo",
    };
  }

  return null;
}

function formatDebugDistance(distance: number): string {
  if (!Number.isFinite(distance)) return "";
  return `${Math.round(distance)} m`;
}

export function NavigationDebugLayer({
  showOnlyIssues = false,
}: NavigationDebugLayerProps) {
  const currentRouteNodeIds = useBuildingStore(
    (state) => state.currentRouteNodeIds
  );

  const [nodes, setNodes] = useState<NavigationNode[]>([]);
  const [edges, setEdges] = useState<NavigationEdge[]>([]);
  const [entrances, setEntrances] = useState<BuildingEntrance[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadNavigationDebugData() {
      try {
        const [nodesData, edgesData, entrancesData] = await Promise.all([
          getNavigationNodes(),
          getNavigationEdges(),
          getBuildingEntrances(),
        ]);

        if (!mounted) return;

        setNodes(nodesData.filter((node) => node.is_active));
        setEdges(edgesData.filter((edge) => edge.is_active));
        setEntrances(entrancesData.filter((entrance) => entrance.is_accessible));
      } catch (error) {
        console.error("Error cargando capa debug de navegación:", error);
      }
    }

    loadNavigationDebugData();

    return () => {
      mounted = false;
    };
  }, []);

  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  );

  const routeNodeSet = useMemo(
    () => new Set(currentRouteNodeIds),
    [currentRouteNodeIds]
  );

  const debugEdges = useMemo<DebugEdge[]>(() => {
    return edges
      .map((edge) => {
        const from = nodeById.get(edge.from_node_id);
        const to = nodeById.get(edge.to_node_id);

        if (!from || !to) return null;

        const fromPoint = new THREE.Vector3(
          Number(from.x),
          DEBUG_EDGE_Y,
          Number(from.z)
        );
        const toPoint = new THREE.Vector3(
          Number(to.x),
          DEBUG_EDGE_Y,
          Number(to.z)
        );
        const distance = fromPoint.distanceTo(toPoint);
        const midpoint = new THREE.Vector3()
          .addVectors(fromPoint, toPoint)
          .multiplyScalar(0.5);

        return {
          edge,
          points: [fromPoint, toPoint],
          midpoint,
          distance,
          issue: getEdgeIssue(edge, distance),
        };
      })
      .filter((edge): edge is DebugEdge => edge !== null);
  }, [edges, nodeById]);

  const visibleDebugEdges = useMemo(
    () =>
      showOnlyIssues
        ? debugEdges.filter(({ issue }) => issue !== null)
        : debugEdges,
    [debugEdges, showOnlyIssues]
  );

  const issueNodeIds = useMemo(() => {
    const ids = new Set<string>();

    for (const { edge, issue } of debugEdges) {
      if (!issue) continue;

      ids.add(edge.from_node_id);
      ids.add(edge.to_node_id);
    }

    return ids;
  }, [debugEdges]);

  const visibleNodes = useMemo(
    () =>
      showOnlyIssues
        ? nodes.filter(
            (node) => issueNodeIds.has(node.id) || routeNodeSet.has(node.id)
          )
        : nodes,
    [issueNodeIds, nodes, routeNodeSet, showOnlyIssues]
  );

  return (
    <>
      {visibleDebugEdges.map(({ edge, points, issue }) => {
        const isCurrentRoute =
          routeNodeSet.has(edge.from_node_id) && routeNodeSet.has(edge.to_node_id);
        const issueColor = issue?.severity === "danger" ? "#ef4444" : "#f59e0b";

        return (
          <Line
            key={edge.id}
            points={points}
            color={isCurrentRoute ? "#22c55e" : issue ? issueColor : edgeColor(edge)}
            lineWidth={isCurrentRoute ? 5 : issue ? 4 : 2}
            transparent
            opacity={edge.is_accessible ? (issue ? 0.94 : 0.72) : 0.28}
          />
        );
      })}

      {visibleDebugEdges
        .filter(({ issue }) => issue !== null)
        .map(({ edge, midpoint, distance, issue }) => {
          const isHovered = hoveredEdgeId === edge.id;
          const color = issue?.severity === "danger" ? "#ef4444" : "#f59e0b";

          return (
            <group key={`issue-${edge.id}`} position={midpoint}>
              <mesh
                onPointerOver={(event) => {
                  event.stopPropagation();
                  setHoveredEdgeId(edge.id);
                }}
                onPointerOut={() => setHoveredEdgeId(null)}
              >
                <sphereGeometry args={[1.25, 16, 16]} />
                <meshBasicMaterial color={color} />
              </mesh>

              {isHovered && (
                <Html position={[0, 3.6, 0]} center>
                  <div className="ito-nav-debug-label ito-nav-debug-label--issue">
                    <strong>{issue?.label}</strong>
                    <span>
                      {edge.from_node_id} {"->"} {edge.to_node_id}
                    </span>
                    <span>{formatDebugDistance(distance)}</span>
                  </div>
                </Html>
              )}
            </group>
          );
        })}

      {visibleNodes.map((node) => {
        const color = nodeColor(node, entrances);
        const isRouteNode = routeNodeSet.has(node.id);
        const isHovered = hoveredNodeId === node.id;
        const entrance = entrances.find(
          (item) => item.node_id === node.id && item.is_primary
        );

        return (
          <group key={node.id} position={[Number(node.x), DEBUG_NODE_Y, Number(node.z)]}>
            <mesh
              onPointerOver={(event) => {
                event.stopPropagation();
                setHoveredNodeId(node.id);
              }}
              onPointerOut={() => setHoveredNodeId(null)}
            >
              <sphereGeometry args={[isRouteNode ? 1.55 : 1.05, 16, 16]} />
              <meshBasicMaterial color={isRouteNode ? "#22c55e" : color} />
            </mesh>

            {(isHovered || isRouteNode) && (
              <Html position={[0, 3.4, 0]} center>
                <div className="ito-nav-debug-label">
                  <strong>{node.code || node.id}</strong>
                  <span>{entrance?.building_name ?? node.name ?? node.node_type}</span>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
}
