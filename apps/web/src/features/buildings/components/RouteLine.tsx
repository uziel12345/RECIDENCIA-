import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { distanceToEstimatedSeconds, type BuildingEntrance } from "@ito-map/shared";

import { useBuildingStore } from "../../../store/building-store";
import { useLocationStore } from "../../../store/location-store";
import {
  getBuildingEntrances,
  NAVIGATION_DATA_CHANGED_EVENT,
} from "../../../services/navigation.service";
import { useNavigationGraph } from "../navigation/hooks/useNavigationGraph";

const ROUTE_HEIGHT = 3;
const ARROW_SPACING = 18; // unidades entre flechas direccionales

type RouteRenderData = {
  routePoints: THREE.Vector3[];
  userStartPoint: THREE.Vector3;
  endPoint: THREE.Vector3;
  destinationName: string;
  totalDistance: number;
  estimatedSeconds: number;
};

type RouteDestination = NonNullable<
  ReturnType<typeof useBuildingStore.getState>["routeDestination"]
>;

function calcTotalDistance(path: THREE.Vector3[]): number {
  let d = 0;
  for (let i = 0; i < path.length - 1; i++) d += path[i].distanceTo(path[i + 1]);
  return d;
}

function normalizeRouteKey(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function expectedEntranceNodeCodes(destination: RouteDestination): Set<string> {
  const code = normalizeRouteKey(destination.code);
  const slug = normalizeRouteKey(destination.slug);
  const name = normalizeRouteKey(destination.name);
  const candidates = new Set<string>();

  if (slug) candidates.add(`n-acceso-${slug}`);

  if (
    code === "lab-qui" ||
    code === "lab-q" ||
    slug === "lab-quimica" ||
    name.includes("laboratorio-de-quimica") ||
    name.includes("lab-ingenieria-quimica")
  ) {
    candidates.add("n-acceso-lab-quimica");
  }

  return candidates;
}

function findDestinationEntrance(
  entrances: BuildingEntrance[],
  destination: RouteDestination
): BuildingEntrance | null {
  const byBuildingId = entrances.filter((e) => e.building_id === destination.id);
  const primaryById = byBuildingId.find((e) => e.is_primary);
  if (primaryById) return primaryById;
  if (byBuildingId[0]) return byBuildingId[0];

  const destinationCode = normalizeRouteKey(destination.code);
  const destinationSlug = normalizeRouteKey(destination.slug);
  const nodeCodes = expectedEntranceNodeCodes(destination);

  const byCode = entrances.filter(
    (e) => normalizeRouteKey(e.building_code) === destinationCode
  );
  const primaryByCode = byCode.find((e) => e.is_primary);
  if (primaryByCode) return primaryByCode;
  if (byCode[0]) return byCode[0];

  if (destinationSlug || nodeCodes.size > 0) {
    return (
      entrances.find((e) => nodeCodes.has(normalizeRouteKey(e.node_code))) ??
      null
    );
  }

  return null;
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

// ── Marcador de destino ────────────────────────────────────────────────────────

function DestinationMarker({
  point,
  name,
}: {
  point: THREE.Vector3;
  name: string;
}) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    const animateRing = (
      ref: { current: THREE.Mesh | null },
      offset: number,
    ) => {
      if (!ref.current) return;
      const progress = ((t + offset) % 2.2) / 2.2;
      ref.current.scale.set(1 + progress * 4, 1 + progress * 4, 1);
      (ref.current.material as THREE.MeshBasicMaterial).opacity =
        (1 - progress) * 0.55;
    };

    animateRing(ring1Ref, 0);
    animateRing(ring2Ref, 0.73);
    animateRing(ring3Ref, 1.47);

    if (beamRef.current) {
      const pulse = (Math.sin(t * 2.8) + 1) / 2;
      (beamRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.06 + pulse * 0.1;
    }
  });

  const gx = point.x;
  const gz = point.z;

  return (
    <>
      {/* Disco de glow en el suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[gx, 0.1, gz]}>
        <circleGeometry args={[5, 40]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.16} />
      </mesh>

      {/* 3 anillos expansivos en ola */}
      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]} position={[gx, 0.25, gz]}>
        <ringGeometry args={[3.5, 5, 40]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.55} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]} position={[gx, 0.35, gz]}>
        <ringGeometry args={[3.5, 5, 40]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.55} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[-Math.PI / 2, 0, 0]} position={[gx, 0.45, gz]}>
        <ringGeometry args={[3.5, 5, 40]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.55} />
      </mesh>

      {/* Polo que conecta el suelo con la esfera */}
      <mesh position={[gx, point.y / 2, gz]}>
        <cylinderGeometry args={[0.25, 0.25, point.y, 6]} />
        <meshStandardMaterial color="#b91c1c" emissive="#b91c1c" emissiveIntensity={0.6} />
      </mesh>

      {/* Esfera (cabeza del pin) en el extremo de la ruta */}
      <mesh position={point}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.9} />
      </mesh>

      {/* Punto blanco interior */}
      <mesh position={point}>
        <sphereGeometry args={[0.9, 20, 20]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.45} />
      </mesh>

      {/* Beacon beam — haz de luz vertical sobre el pin */}
      <mesh ref={beamRef} position={[gx, point.y + 20, gz]}>
        <cylinderGeometry args={[0.5, 1.8, 40, 8, 1, true]} />
        <meshBasicMaterial
          color="#ef4444"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Label */}
      <Html position={[gx, point.y + 5.5, gz]} center>
        <div
          style={{
            background: "rgba(239,68,68,0.95)",
            color: "#fff",
            padding: "5px 12px 5px 8px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: "0 6px 20px rgba(0,0,0,0.28)",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
            letterSpacing: "0.015em",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.8)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          {name}
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

  useEffect(() => {
    let mounted = true;

    async function loadEntrances() {
      try {
        const data = await getBuildingEntrances();
        if (mounted) setEntrances(data.filter((e) => e.is_accessible));
      } catch (err: unknown) {
        console.error("Error cargando entradas:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    function refreshEntrances() {
      void loadEntrances();
    }

    void loadEntrances();
    const intervalId = window.setInterval(refreshEntrances, 30000);
    window.addEventListener(NAVIGATION_DATA_CHANGED_EVENT, refreshEntrances);
    window.addEventListener("focus", refreshEntrances);
    document.addEventListener("visibilitychange", refreshEntrances);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener(NAVIGATION_DATA_CHANGED_EVENT, refreshEntrances);
      window.removeEventListener("focus", refreshEntrances);
      document.removeEventListener("visibilitychange", refreshEntrances);
    };
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

    const destinationEntrance = findDestinationEntrance(
      entrances,
      routeDestination
    );

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

    const rawPath = findPath(from, to, destinationEntrance.node_id);
    if (cancelled) return;

    if (rawPath.length < 2) {
      setCurrentRouteNodeIds([]);
      setRouteStats(null);
      setRouteData(null);
      setRouteError("No se encontro una ruta disponible hacia este edificio.");
      return;
    }

    const userStartPoint = new THREE.Vector3(
      mapPosition.x, mapPosition.y + ROUTE_HEIGHT, mapPosition.z
    );
    const navigationPoints = rawPath.map(
      (p) => new THREE.Vector3(p.x, p.y + ROUTE_HEIGHT, p.z)
    );
    const routePoints =
      navigationPoints[0] && userStartPoint.distanceTo(navigationPoints[0]) > 1
        ? [userStartPoint, ...navigationPoints]
        : navigationPoints;

    // Override the last waypoint with the building's actual GLB position (same
    // coordinates as the orange beacon), so the route and destination marker
    // always land on the building regardless of entrance-node coordinate accuracy.
    const buildingX = Number(routeDestination.x);
    const buildingZ = Number(routeDestination.z);
    if (Number.isFinite(buildingX) && Number.isFinite(buildingZ)) {
      routePoints[routePoints.length - 1] = new THREE.Vector3(
        buildingX, ROUTE_HEIGHT, buildingZ
      );
    }

    const totalDistance = calcTotalDistance(routePoints);
    const estimatedSeconds = distanceToEstimatedSeconds(totalDistance);
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

  const { routePoints, endPoint, destinationName } = routeData;

  // Puntos de la ruta en el plano XZ (para calcular flechas)
  const arrowData = sampleArrowPoints(routePoints, ARROW_SPACING);

  return (
    <>
      {/* Conector punteado: posición GPS → inicio de ruta */}
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

      {/* Marcador destino */}
      <DestinationMarker point={endPoint} name={destinationName} />
    </>
  );
}
