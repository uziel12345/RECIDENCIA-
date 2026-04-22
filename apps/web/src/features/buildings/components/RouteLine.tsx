import { useMemo } from "react";
import * as THREE from "three";
import { Html, Line } from "@react-three/drei";

import { useBuildingStore } from "../../../store/building-store";
import { useLocationStore } from "../../../store/location-store";
import { campusNodes } from "../navigation/data/campusNodes";
import { findRouteFromUserToBuilding } from "../navigation/utils/buildingRoute";

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

function getNodePosition(node: CampusNode) {
  if (typeof node.x === "number" && typeof node.z === "number") {
    return {
      x: node.x,
      y: typeof node.y === "number" ? node.y : 0,
      z: node.z,
    };
  }

  return {
    x: node.position?.x ?? 0,
    y: node.position?.y ?? 0,
    z: node.position?.z ?? 0,
  };
}

export function RouteLine() {
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const mapPosition = useLocationStore((state) => state.mapPosition);

  const routeData = useMemo(() => {
    if (!routeDestination || !mapPosition) {
      return null;
    }

    const routeNodeIds = findRouteFromUserToBuilding(
      {
        x: mapPosition.x,
        y: mapPosition.y,
        z: mapPosition.z,
      },
      routeDestination.id
    );

    if (!routeNodeIds || routeNodeIds.length === 0) {
      return null;
    }

    const nodePoints = routeNodeIds.flatMap((nodeId: string) => {
      const node = (campusNodes as CampusNode[]).find((n) => n.id === nodeId);

      if (!node) {
        return [];
      }

      const pos = getNodePosition(node);

      return [new THREE.Vector3(pos.x, pos.y + 2, pos.z)];
    });

    if (nodePoints.length === 0) {
      return null;
    }

    const userStartPoint = new THREE.Vector3(
      mapPosition.x,
      mapPosition.y + 2,
      mapPosition.z
    );

    const routePoints = [userStartPoint, ...nodePoints];

    if (routePoints.length < 2) {
      return null;
    }

    return {
      routeNodeIds,
      routePoints,
      userStartPoint,
      endPoint: nodePoints[nodePoints.length - 1],
      destinationName: routeDestination.name,
    };
  }, [routeDestination, mapPosition]);

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