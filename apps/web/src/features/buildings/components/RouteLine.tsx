import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { distanceToEstimatedSeconds } from "@ito-map/shared";

import { useBuildingStore } from "../../../store/building-store";
import { useLocationStore } from "../../../store/location-store";
import {
  getBuildingEntrances,
  type BuildingEntrance,
} from "../../../services/navigation.service";
import { useNavigationGraph } from "../navigation/hooks/useNavigationGraph";

const ROUTE_HEIGHT = 8;
const ARROW_SPACING = 18; // unidades entre flechas direccionales

type RouteRenderData = {
  routePoints: THREE.Vector3[];
  userStartPoint: THREE.Vector3;
  endPoint: THREE.Vector3;
  destinationName: string;
  totalDistance: number;
  estimatedSeconds: number;
};

function calcTotalDistance(path: THREE.Vector3[]): number {
  let d = 0;
  for (let i = 0; i < path.length - 1; i++) d += path[i].distanceTo(path[i + 1]);
  return d;
}

// Devuelve puntos equiespaciados a lo largo del path para las flechas
function sampleArrowPoints(
  path: THREE.Vector3[],
  spacing: number
): { position: THREE.Vector3; direction: THREE.Vector3 }[] {
  if (path.length < 2) return [];

  const result: { position: THREE.Vector3; direction: THREE.Vector3 }[] = [];
  let accumulated = spacing * 0.5; // empieza a mitad de distancia para centrar

  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const segLen = a.distanceTo(b);
    const dir = b.clone().sub(a).normalize();

    while (accumulated <= segLen) {
      result.push({
        position: a.clone().addScaledVector(dir, accumulated),
        direction: dir.clone(),
      });
      accumulated += spacing;
    }
    accumulated -= segLen;
  }
  return result;
}

// ── Flecha individual animada ──────────────────────────────────────────────────

function RouteArrow({
  position,
  direction,
  index,
}: {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const DEFAULT_UP = new THREE.Vector3(0, 1, 0);

  // Quaternion para alinear el cono con la dirección de movimiento (plano XZ)
  const flatDir = new THREE.Vector3(direction.x, 0, direction.z).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(DEFAULT_UP, flatDir);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    // Pulso con offset por índice para efecto "marching"
    const t = (Math.sin(clock.getElapsedTime() * 2.5 - index * 0.9) + 1) / 2;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = 0.45 + t * 0.5;
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      quaternion={quaternion}
    >
      <coneGeometry args={[0.7, 2.2, 6]} />
      <meshStandardMaterial
        color="#22c55e"
        emissive="#16a34a"
        emissiveIntensity={0.4}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

// ── Línea con pulso animado ────────────────────────────────────────────────────

function AnimatedRouteLine({ points }: { points: THREE.Vector3[] }) {
  const lineRef = useRef<THREE.Line>(null);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    const t = (Math.sin(clock.getElapsedTime() * 2) + 1) / 2;
    mat.opacity = 0.75 + t * 0.2;
  });

  return (
    <>
      {/* Sombra blanca */}
      <Line
        points={points}
        color="#ffffff"
        lineWidth={14}
        transparent
        opacity={0.55}
        depthTest={false}
        renderOrder={20}
      />
      {/* Línea principal verde */}
      <Line
        ref={lineRef as React.Ref<never>}
        points={points}
        color="#22c55e"
        lineWidth={7}
        transparent
        opacity={0.95}
        depthTest={false}
        renderOrder={21}
      />
    </>
  );
}

// ── Conector punteado usuario → primer nodo ────────────────────────────────────

function UserConnector({
  userPoint,
  routeStart,
}: {
  userPoint: THREE.Vector3;
  routeStart: THREE.Vector3;
}) {
  if (userPoint.distanceTo(routeStart) < 2) return null;

  return (
    <Line
      points={[userPoint, routeStart]}
      color="#94a3b8"
      lineWidth={3}
      dashed
      dashSize={2.5}
      gapSize={1.8}
      transparent
      opacity={0.65}
      depthTest={false}
      renderOrder={19}
    />
  );
}

// ── Marcador de destino ────────────────────────────────────────────────────────

function DestinationMarker({
  point,
  name,
}: {
  point: THREE.Vector3;
  name: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = (Math.sin(clock.getElapsedTime() * 2.2) + 1) / 2;
    ringRef.current.scale.set(1 + t * 0.4, 1 + t * 0.4, 1);
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6 - t * 0.3;
  });

  const groundPos = new THREE.Vector3(point.x, 0.5, point.z);

  return (
    <>
      {/* Esfera destino */}
      <mesh position={point}>
        <sphereGeometry args={[1.3, 20, 20]} />
        <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.7} />
      </mesh>

      {/* Ring pulsante en el suelo */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={groundPos}>
        <ringGeometry args={[4.5, 6.5, 32]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Label destino */}
      <Html
        position={[point.x, point.y + 4, point.z]}
        center
      >
        <div
          style={{
            background: "rgba(239,68,68,0.94)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
            pointerEvents: "none",
          }}
        >
          Destino — {name}
        </div>
      </Html>
    </>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export function RouteLine() {
  const routeDestination = useBuildingStore((s) => s.routeDestination);
  const setCurrentRouteNodeIds = useBuildingStore((s) => s.setCurrentRouteNodeIds);
  const setRouteStats = useBuildingStore((s) => s.setRouteStats);
  const setRouteError = useBuildingStore((s) => s.setRouteError);

  const mapPosition = useLocationStore((s) => s.mapPosition);
  const permission = useLocationStore((s) => s.permission);

  const [entrances, setEntrances] = useState<BuildingEntrance[]>([]);
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<RouteRenderData | null>(null);

  const { findPath, isReady } = useNavigationGraph();

  // Carga entradas una sola vez al montar
  useEffect(() => {
    let mounted = true;
    getBuildingEntrances()
      .then((data) => {
        if (mounted) setEntrances(data.filter((e) => e.is_accessible));
      })
      .catch((err: unknown) => console.error("Error cargando entradas:", err))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Calcula la ruta cada vez que cambia: destino, posición, grafo listo
  useEffect(() => {
    let cancelled = false;

    setRouteData(null);

    if (loading || !routeDestination) {
      setCurrentRouteNodeIds([]);
      return;
    }

    if (!isReady) {
      setCurrentRouteNodeIds([]);
      setRouteStats(null);
      setRouteError("Preparando el grafo de navegacion del campus.");
      return;
    }

    if (permission !== "granted") {
      setCurrentRouteNodeIds([]);
      setRouteStats(null);
      setRouteError("Activa el permiso de ubicacion para trazar la ruta.");
      return;
    }

    if (!mapPosition) {
      setCurrentRouteNodeIds([]);
      setRouteStats(null);
      setRouteError("Esperando tu ubicacion actual para trazar la ruta.");
      return;
    }

    const destinationEntrance =
      entrances.find((e) => e.building_id === routeDestination.id && e.is_primary) ??
      entrances.find((e) => e.building_id === routeDestination.id) ??
      null;

    if (!destinationEntrance) {
      setCurrentRouteNodeIds([]);
      setRouteError(`${routeDestination.name} no tiene una entrada configurada.`);
      return;
    }

    const dx = Number(destinationEntrance.node_x);
    const dy = Number(destinationEntrance.node_y);
    const dz = Number(destinationEntrance.node_z);

    if (!Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(dz)) {
      setCurrentRouteNodeIds([]);
      setRouteStats(null);
      setRouteError("La entrada del edificio no tiene coordenadas validas.");
      return;
    }

    const from = new THREE.Vector3(mapPosition.x, 0, mapPosition.z);
    const to   = new THREE.Vector3(dx, dy, dz);

    const rawPath = findPath(from, to);
    if (cancelled) return;

    if (rawPath.length < 2) {
      setCurrentRouteNodeIds([]);
      setRouteStats(null);
      setRouteData(null);
      setRouteError("No se encontro una ruta disponible hacia este edificio.");
      return;
    }

    const totalDistance = calcTotalDistance(rawPath);
    const estimatedSeconds = distanceToEstimatedSeconds(totalDistance);

    // Elevar puntos a ROUTE_HEIGHT para visibilidad
    const routePoints = rawPath.map(
      (p) => new THREE.Vector3(p.x, p.y + ROUTE_HEIGHT, p.z)
    );
    const userStartPoint = new THREE.Vector3(
      mapPosition.x, mapPosition.y + ROUTE_HEIGHT, mapPosition.z
    );
    const endPoint = routePoints[routePoints.length - 1]!;

    setCurrentRouteNodeIds([]);
    setRouteStats({ totalDistance, estimatedSeconds });
    setRouteError(null);
    setRouteData({
      routePoints,
      userStartPoint,
      endPoint,
      destinationName: routeDestination.name,
      totalDistance,
      estimatedSeconds,
    });

    return () => { cancelled = true; };
  }, [
    loading, isReady, routeDestination, mapPosition, permission, entrances,
    findPath, setCurrentRouteNodeIds, setRouteStats, setRouteError,
  ]);

  if (!routeData) return null;

  const { routePoints, userStartPoint, endPoint, destinationName } = routeData;

  // Puntos de la ruta en el plano XZ (para calcular flechas)
  const arrowData = sampleArrowPoints(routePoints, ARROW_SPACING);

  return (
    <>
      {/* Conector punteado: posición GPS → inicio de ruta */}
      <UserConnector userPoint={userStartPoint} routeStart={routePoints[0]!} />

      {/* Línea principal animada */}
      <AnimatedRouteLine points={routePoints} />

      {/* Flechas direccionales */}
      {arrowData.map((arrow, i) => (
        <RouteArrow
          key={i}
          position={arrow.position}
          direction={arrow.direction}
          index={i}
        />
      ))}

      {/* Marcador inicio */}
      <mesh position={routePoints[0] ?? userStartPoint}>
        <sphereGeometry args={[1.1, 20, 20]} />
        <meshStandardMaterial color="#22c55e" emissive="#166534" emissiveIntensity={0.4} />
      </mesh>

      <Html
        position={[
          userStartPoint.x,
          userStartPoint.y + 3.5,
          userStartPoint.z,
        ]}
        center
      >
        <div
          style={{
            background: "rgba(34,197,94,0.94)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
            pointerEvents: "none",
          }}
        >
          Tu ubicacion
        </div>
      </Html>

      {/* Marcador destino */}
      <DestinationMarker point={endPoint} name={destinationName} />
    </>
  );
}
