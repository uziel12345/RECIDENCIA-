import { useEffect, useMemo, useState } from "react";

import { useBuildingStore } from "../../../store/building-store";
import { useLocationStore } from "../../../store/location-store";
import { buildings } from "../data/buildings";
import { buildingEntrances } from "../navigation/data/buildingEntrances";
import { campusNodes } from "../navigation/data/campusNodes";

type Position3D = {
  x: number;
  y: number;
  z: number;
};

type CampusNodeLike = {
  id?: string;
  x?: number;
  y?: number;
  z?: number;
  position?: {
    x: number;
    y?: number;
    z: number;
  };
};

type BuildingEntranceLike = {
  buildingId?: string;
  nodeId?: string;
  entranceNodeId?: string;
  node?: string;
};

function getNodePosition(node: CampusNodeLike): Position3D | null {
  if (
    typeof node.x === "number" &&
    typeof node.z === "number"
  ) {
    return {
      x: node.x,
      y: typeof node.y === "number" ? node.y : 0,
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
      y: typeof node.position.y === "number" ? node.position.y : 0,
      z: node.position.z,
    };
  }

  return null;
}

function getNodeId(entry: BuildingEntranceLike): string | null {
  if (typeof entry.nodeId === "string") {
    return entry.nodeId;
  }

  if (typeof entry.entranceNodeId === "string") {
    return entry.entranceNodeId;
  }

  if (typeof entry.node === "string") {
    return entry.node;
  }

  return null;
}

function distance2D(a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function findNearestBuildingToUser(
  userPosition: { x: number; z: number }
): { buildingId: string; distance: number } | null {
  if (!Array.isArray(buildingEntrances) || !Array.isArray(campusNodes)) {
    return null;
  }

  const nodeMap = new Map<string, Position3D>();

  for (const node of campusNodes as CampusNodeLike[]) {
    if (!node.id) {
      continue;
    }

    const position = getNodePosition(node);
    if (!position) {
      continue;
    }

    nodeMap.set(node.id, position);
  }

  let nearest: { buildingId: string; distance: number } | null = null;

  for (const entrance of buildingEntrances as BuildingEntranceLike[]) {
    if (typeof entrance.buildingId !== "string") {
      continue;
    }

    const nodeId = getNodeId(entrance);
    if (!nodeId) {
      continue;
    }

    const nodePosition = nodeMap.get(nodeId);
    if (!nodePosition) {
      continue;
    }

    const currentDistance = distance2D(userPosition, nodePosition);

    if (nearest === null || currentDistance < nearest.distance) {
      nearest = {
        buildingId: entrance.buildingId,
        distance: currentDistance,
      };
    }
  }

  return nearest;
}

export function RoutePanel() {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);

  const routeOrigin = useBuildingStore((state) => state.routeOrigin);
  const routeDestination = useBuildingStore((state) => state.routeDestination);

  const setRouteOrigin = useBuildingStore((state) => state.setRouteOrigin);
  const setRouteDestination = useBuildingStore((state) => state.setRouteDestination);
  const clearRoute = useBuildingStore((state) => state.clearRoute);

  const mapPosition = useLocationStore((state) => state.mapPosition);
  const permission = useLocationStore((state) => state.permission);
  const geoPosition = useLocationStore((state) => state.geoPosition);
  const errorMessage = useLocationStore((state) => state.errorMessage);

  const [autoRouteEnabled, setAutoRouteEnabled] = useState(true);

  const nearestBuilding = useMemo(() => {
    if (!mapPosition) {
      return null;
    }

    const nearest = findNearestBuildingToUser({
      x: mapPosition.x,
      z: mapPosition.z,
    });

    if (!nearest) {
      return null;
    }

    return (
      buildings.find((building) => building.id === nearest.buildingId) ?? null
    );
  }, [mapPosition]);

  useEffect(() => {
    if (!autoRouteEnabled) {
      return;
    }

    if (!selectedBuilding) {
      clearRoute();
      return;
    }

    if (!nearestBuilding) {
      return;
    }

    if (nearestBuilding.id === selectedBuilding.id) {
      clearRoute();
      return;
    }

    setRouteOrigin(nearestBuilding);
    setRouteDestination(selectedBuilding);
  }, [
    autoRouteEnabled,
    selectedBuilding,
    nearestBuilding,
    setRouteOrigin,
    setRouteDestination,
    clearRoute,
  ]);

  const handleUseCurrentLocation = () => {
    if (!selectedBuilding || !nearestBuilding) {
      return;
    }

    if (nearestBuilding.id === selectedBuilding.id) {
      clearRoute();
      return;
    }

    setAutoRouteEnabled(true);
    setRouteOrigin(nearestBuilding);
    setRouteDestination(selectedBuilding);
  };

  const handleClearRoute = () => {
    setAutoRouteEnabled(false);
    clearRoute();
  };

  const canRoute =
    selectedBuilding !== null &&
    nearestBuilding !== null &&
    nearestBuilding.id !== selectedBuilding.id;

  return (
    <div
      style={{
        position: "absolute",
        top: 120,
        left: 20,
        width: 360,
        background: "rgba(255, 255, 255, 0.96)",
        borderRadius: 16,
        padding: 18,
        zIndex: 20,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.16)",
        border: "1px solid rgba(229, 231, 235, 0.9)",
        backdropFilter: "blur(8px)",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#6b7280",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Ruta automática
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 6,
              letterSpacing: "0.05em",
            }}
          >
            Estado de ubicación
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
              marginBottom: 6,
            }}
          >
            {permission === "granted"
              ? "Ubicación disponible"
              : permission === "denied"
              ? "Permiso denegado"
              : permission === "unsupported"
              ? "No soportado"
              : "Esperando permiso"}
          </div>

          {geoPosition && (
            <div style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.5 }}>
              Precisión actual:{" "}
              {geoPosition.accuracy !== null
                ? `${geoPosition.accuracy.toFixed(1)} m`
                : "sin dato"}
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#b45309",
                lineHeight: 1.5,
              }}
            >
              {errorMessage}
            </div>
          )}
        </div>

        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 6,
              letterSpacing: "0.05em",
            }}
          >
            Origen detectado
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {nearestBuilding ? nearestBuilding.name : "Sin origen detectado"}
          </div>
        </div>

        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 6,
              letterSpacing: "0.05em",
            }}
          >
            Destino seleccionado
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {selectedBuilding ? selectedBuilding.name : "Selecciona un edificio"}
          </div>
        </div>

        {routeOrigin && routeDestination && (
          <div
            style={{
              background: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 13,
              color: "#166534",
              lineHeight: 1.6,
            }}
          >
            Ruta activa desde <strong>{routeOrigin.name}</strong> hacia{" "}
            <strong>{routeDestination.name}</strong>.
          </div>
        )}

        {selectedBuilding && nearestBuilding && nearestBuilding.id === selectedBuilding.id && (
          <div
            style={{
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 13,
              color: "#1d4ed8",
              lineHeight: 1.6,
            }}
          >
            Ya te encuentras en el edificio más cercano al destino seleccionado.
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={!canRoute}
            style={{
              border: "none",
              background: canRoute ? "#2563eb" : "#cbd5e1",
              color: "#ffffff",
              padding: "12px 14px",
              borderRadius: 12,
              cursor: canRoute ? "pointer" : "not-allowed",
              fontSize: 13,
              fontWeight: 700,
              boxShadow: canRoute
                ? "0 10px 20px rgba(37, 99, 235, 0.2)"
                : "none",
            }}
          >
            Usar mi ubicación
          </button>

          <button
            type="button"
            onClick={handleClearRoute}
            style={{
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              color: "#111827",
              padding: "12px 14px",
              borderRadius: 12,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Limpiar ruta
          </button>
        </div>
      </div>
    </div>
  );
}