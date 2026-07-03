import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Box3, Vector3, type Object3D } from "three";
import type { Building } from "../../features/buildings/types/building";
import { useLocationStore } from "../../store/location-store";
import { useBuildingStore } from "../../store/building-store";
import { useAdminAuthStore } from "../../store/admin-auth-store";
import { useBuildings } from "../../hooks/useBuildings";
import {
  startUserLocationTracking,
  stopUserLocationTracking,
} from "../../features/location/services/geolocation";
import {
  gpsToXZ,
  setActiveGpsTransform,
} from "../../features/location/services/campus-transform";
import { resolveCurrentBuilding } from "../../features/location/services/location-resolver";
import {
  getActiveCalibrationProfileApi,
  getBuildingGeofencesApi,
  type BuildingGeofence,
} from "@ito-map/shared";
import { SetBuildingGpsPanel } from "./SetBuildingGpsPanel";
import { CampusCalibrationPanel } from "./CampusCalibrationPanel";
import { RouteLine } from "../../features/buildings/components/RouteLine";
import { getCategoryAccent } from "../ui/categoryAccent";
import {
  NavigationDraftEditorLayer,
  useDraftEditor,
} from "./NavigationDraftEditorLayer";
import { NavigationEditorModal } from "./NavigationEditorModal";
import { NavigationDebugLayer } from "./NavigationDebugLayer";
import { DestinationBuildingHighlight } from "./DestinationBuildingHighlight";
import { resolveGlbName } from "./glb-utils";
import { useBuildingGlbStore } from "../../store/building-glb-store";
import { CameraAnimator, type CameraAnim } from "./CameraAnimator";
import { CampusModel, MODEL_PATH } from "./CampusModel";
import { CategoryLegend } from "./CategoryLegend";
import { UserLocationMarker } from "./UserLocationMarker";
import { ViewerLoading } from "./ViewerLoading";
import { ViewerToolbar, type NavigationDebugMode } from "./ViewerToolbar";

const CAMPUS_ROTATION_Y = Math.PI / 2;
const DEFAULT_CAMPUS_POSITION = new Vector3(0, 0, 0);

export type ViewMode = "immersive" | "aerial";

// Modo inmersivo (por defecto): cerca del suelo, "dentro" del mapa, para
// distinguir fachadas mientras se navega. Ángulo de picado pronunciado
// (Y alto vs. Z) para que el cielo vacío no domine el encuadre.
const DESKTOP_IMMERSIVE_CAMERA_POSITION = new Vector3(0, 150, 230);
const MOBILE_IMMERSIVE_CAMERA_POSITION = new Vector3(0, 190, 270);
// Modo aéreo: encuadra todo el campus desde arriba, para orientarse antes
// de acercarse a una zona. Más cerca que la vista aérea original para no
// verse tan alejado.
const DESKTOP_AERIAL_CAMERA_POSITION = new Vector3(0, 300, 300);
const MOBILE_AERIAL_CAMERA_POSITION = new Vector3(0, 320, 400);
const CAMERA_TARGET = new Vector3(0, 0, 0);
// El desplazamiento horizontal que compensa el sidebar (mapXOffset) está
// calibrado para la distancia de la cámara inmersiva. La vista aérea está
// más lejos del objetivo, así que el mismo desplazamiento en unidades de
// mundo se ve proporcionalmente más pequeño en pantalla — se escala para
// que el campus quede igual de centrado en ambos modos.
const AERIAL_XOFFSET_SCALE = 1.55;
const BUILDING_FOCUS_DESKTOP_DISTANCE = 185;
const BUILDING_FOCUS_MOBILE_DISTANCE = 245;
const BUILDING_FOCUS_DESKTOP_HEIGHT = 125;
const BUILDING_FOCUS_MOBILE_HEIGHT = 155;
const BUILDING_FOCUS_LOOK_HEIGHT = 8;

function getModeCameraPosition(mode: ViewMode, isMobile: boolean): Vector3 {
  if (isMobile) {
    return mode === "aerial"
      ? MOBILE_AERIAL_CAMERA_POSITION
      : MOBILE_IMMERSIVE_CAMERA_POSITION;
  }
  return mode === "aerial"
    ? DESKTOP_AERIAL_CAMERA_POSITION
    : DESKTOP_IMMERSIVE_CAMERA_POSITION;
}

function getModeXOffset(
  mode: ViewMode,
  isMobile: boolean,
  mapXOffset: number,
): number {
  if (isMobile) return 0;
  return mode === "aerial" ? mapXOffset * AERIAL_XOFFSET_SCALE : mapXOffset;
}

function ModelLoadedSignal({ onLoaded }: { onLoaded: () => void }) {
  useEffect(() => {
    onLoaded();
  }, [onLoaded]);
  return null;
}

function LocationSync({ buildings }: { buildings: Building[] }) {
  const geoPosition = useLocationStore((state) => state.geoPosition);
  const simulatedPosition = useLocationStore((state) => state.simulatedPosition);
  const setMapPosition = useLocationStore((state) => state.setMapPosition);
  const setNearestBuilding = useLocationStore((state) => state.setNearestBuilding);
  const [geofences, setGeofences] = useState<BuildingGeofence[]>([]);
  const pendingResolvedRef = useRef<{
    buildingId: string;
    firstSeenAt: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBuildingGeofencesApi()
      .then((items) => {
        if (!cancelled) setGeofences(items);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (simulatedPosition) return;

    if (!geoPosition) {
      setMapPosition(null);
      setNearestBuilding(null);
      return;
    }

    // Convierte la posición GPS real a coordenadas 3D del modelo usando la
    // transformación afín. El marcador sigue al usuario con precisión continua,
    // no anclado al centro del edificio más cercano.
    const { x, z } = gpsToXZ(geoPosition.latitude, geoPosition.longitude);
    const mapPosition = { x, y: 2, z };
    setMapPosition(mapPosition);

    // Detección del edificio cercano: solo para la etiqueta informativa.
    const resolved = resolveCurrentBuilding(buildings, geoPosition, mapPosition, geofences);
    const current = useLocationStore.getState().nearestBuilding;
    if (!resolved) {
      pendingResolvedRef.current = null;
      setNearestBuilding(null);
      return;
    }

    const isClearGeofence = resolved.method === "geofence" && resolved.confidence === "high";
    if (!current || current.buildingId === resolved.buildingId || isClearGeofence) {
      pendingResolvedRef.current = null;
      setNearestBuilding(resolved);
      return;
    }

    const now = Date.now();
    const pending = pendingResolvedRef.current;
    if (pending?.buildingId !== resolved.buildingId) {
      pendingResolvedRef.current = { buildingId: resolved.buildingId, firstSeenAt: now };
      return;
    }

    if (now - pending.firstSeenAt >= 5000) {
      pendingResolvedRef.current = null;
      setNearestBuilding(resolved);
    }
  }, [buildings, geoPosition, geofences, simulatedPosition, setMapPosition, setNearestBuilding]);

  return null;
}

// Límites del campus en coordenadas mundo (después del auto-centering).
// X y Z abarcan el footprint del modelo + margen; Y impide bajar del suelo.
const CAMPUS_LIMIT = {
  minX: -600,  maxX: 600,
  minZ: -600,  maxZ: 600,
  minTargetY: -50, maxTargetY: 600,
  minCamY: 15,
};

function CameraConstraints({
  controlsRef,
}: {
  controlsRef: React.RefObject<any>;
}) {
  useFrame((state) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    let dirty = false;

    if (ctrl.object.position.y < CAMPUS_LIMIT.minCamY) {
      ctrl.object.position.y = CAMPUS_LIMIT.minCamY;
      dirty = true;
    }

    const t = ctrl.target;
    if (t.x < CAMPUS_LIMIT.minX) { t.x = CAMPUS_LIMIT.minX; dirty = true; }
    if (t.x > CAMPUS_LIMIT.maxX) { t.x = CAMPUS_LIMIT.maxX; dirty = true; }
    if (t.z < CAMPUS_LIMIT.minZ) { t.z = CAMPUS_LIMIT.minZ; dirty = true; }
    if (t.z > CAMPUS_LIMIT.maxZ) { t.z = CAMPUS_LIMIT.maxZ; dirty = true; }
    if (t.y < CAMPUS_LIMIT.minTargetY) { t.y = CAMPUS_LIMIT.minTargetY; dirty = true; }
    if (t.y > CAMPUS_LIMIT.maxTargetY) { t.y = CAMPUS_LIMIT.maxTargetY; dirty = true; }

    if (dirty) { ctrl.update(); state.invalidate(); }
  });
  return null;
}

// Tamaño del plano invisible de clic (cubre de sobra el footprint del
// campus, ver CAMPUS_LIMIT) y umbral de movimiento para distinguir un clic
// de un arrastre de OrbitControls (mismo patrón que NavigationDraftEditorLayer).
const TELEPORT_PLANE_SIZE = 1400;
const MAX_TELEPORT_CLICK_MOVEMENT_PX = 5;

// Activo solo en modo aéreo: clic/tap en el mapa y la cámara "aterriza" ahí
// en modo inmersivo, como un teletransporte a nivel de calle.
function AerialTeleportLayer({
  active,
  onTeleport,
}: {
  active: boolean;
  onTeleport: (worldX: number, worldZ: number) => void;
}) {
  const pointerStartRef = useRef<{ clientX: number; clientY: number } | null>(null);

  if (!active) return null;

  return (
    <mesh
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        pointerStartRef.current = {
          clientX: event.nativeEvent.clientX,
          clientY: event.nativeEvent.clientY,
        };
      }}
      onPointerUp={(event) => {
        const start = pointerStartRef.current;
        pointerStartRef.current = null;
        if (!start) return;
        const movement = Math.hypot(
          event.nativeEvent.clientX - start.clientX,
          event.nativeEvent.clientY - start.clientY,
        );
        if (movement > MAX_TELEPORT_CLICK_MOVEMENT_PX) return;
        onTeleport(event.point.x, event.point.z);
      }}
    >
      <planeGeometry args={[TELEPORT_PLANE_SIZE, TELEPORT_PLANE_SIZE]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

type FocusPoint = {
  x: number;
  z: number;
  worldX: number;
  worldZ: number;
};

type CampusViewerProps = {
  isMobile?: boolean;
  mobilePanelOpen?: boolean;
  enableAdminTools?: boolean;
  hideCategoryLegend?: boolean;
  /** Pan horizontal (world-X) para centrar el campus en el área visible
   *  cuando un sidebar lo cubre. Negativo = desplaza campus a la derecha en pantalla. */
  mapXOffset?: number;
};

function getCenteredCampusPosition(scene: Object3D) {
  scene.updateMatrixWorld(true);
  const box = new Box3().setFromObject(scene);
  if (box.isEmpty()) return DEFAULT_CAMPUS_POSITION.clone();

  const center = box.getCenter(new Vector3());
  const cos = Math.cos(CAMPUS_ROTATION_Y);
  const sin = Math.sin(CAMPUS_ROTATION_Y);
  return new Vector3(
    -(center.x * cos + center.z * sin),
    -box.min.y,
    -(-center.x * sin + center.z * cos),
  );
}

function CampusBoundsSync({
  onPositionChange,
  controlsRef,
  isMobile,
  mapXOffset = 0,
  viewMode,
}: {
  onPositionChange: (position: Vector3) => void;
  controlsRef: React.RefObject<any>;
  isMobile: boolean;
  mapXOffset?: number;
  viewMode: ViewMode;
}) {
  const { scene } = useGLTF(MODEL_PATH);
  const { camera, invalidate } = useThree();

  useEffect(() => {
    onPositionChange(getCenteredCampusPosition(scene));

    // Pose inicial según el modo de vista activo: inmersiva (cerca del
    // suelo, "dentro" del mapa) o aérea (encuadra todo el campus).
    const pose = getModeCameraPosition(viewMode, isMobile);
    const xOff = getModeXOffset(viewMode, isMobile, mapXOffset);
    if (isMobile) {
      camera.position.set(0, pose.y, pose.z);
    } else {
      camera.position.set(xOff, pose.y, pose.z);
      if (controlsRef.current) {
        controlsRef.current.target.set(xOff, 0, 0);
      }
    }
    controlsRef.current?.update();
    invalidate();
  }, [scene, onPositionChange, camera, invalidate, controlsRef, isMobile, mapXOffset, viewMode]);

  return null;
}

function campusLocalToWorld(x: number, z: number, campusPosition: Vector3) {
  const cos = Math.cos(CAMPUS_ROTATION_Y);
  const sin = Math.sin(CAMPUS_ROTATION_Y);
  return {
    x: x * cos + z * sin + campusPosition.x,
    z: -x * sin + z * cos + campusPosition.z,
  };
}

function getCameraMoveDuration(from: Vector3 | undefined, to: Vector3) {
  if (!from) return 1.35;
  const distance = from.distanceTo(to);
  return Math.min(Math.max(distance / 360, 1.25), 2.2);
}

function createFocusPoint(
  x: number,
  z: number,
  campusPosition: Vector3,
): FocusPoint {
  const world = campusLocalToWorld(x, z, campusPosition);
  return {
    x,
    z,
    worldX: world.x,
    worldZ: world.z,
  };
}

function nearlyEqual(a: number, b: number) {
  return Math.abs(a - b) < 0.001;
}

// Posa la cámara mirando a un punto del mundo, conservando la dirección
// horizontal desde la que ya se estaba mirando (para que la transición se
// sienta continua en vez de resetear el ángulo de la vista).
function getPointFocusPose(
  worldX: number,
  worldZ: number,
  lookHeight: number,
  distance: number,
  height: number,
  controls: { object?: { position: Vector3 }; target?: Vector3 } | null | undefined,
) {
  const targetLook = new Vector3(worldX, lookHeight, worldZ);

  const viewOffset = controls?.object?.position && controls?.target
    ? controls.object.position.clone().sub(controls.target)
    : new Vector3(0, height, distance);

  const horizontal = new Vector3(viewOffset.x, 0, viewOffset.z);
  if (horizontal.lengthSq() < 1) {
    horizontal.set(0, 0, distance);
  } else {
    horizontal.setLength(distance);
  }

  return {
    pos: new Vector3(
      targetLook.x + horizontal.x,
      height,
      targetLook.z + horizontal.z,
    ),
    look: targetLook,
  };
}

function getBuildingFocusPose(
  focus: FocusPoint,
  isMobile: boolean,
  controls: { object?: { position: Vector3 }; target?: Vector3 } | null | undefined,
) {
  const distance = isMobile
    ? BUILDING_FOCUS_MOBILE_DISTANCE
    : BUILDING_FOCUS_DESKTOP_DISTANCE;
  const height = isMobile
    ? BUILDING_FOCUS_MOBILE_HEIGHT
    : BUILDING_FOCUS_DESKTOP_HEIGHT;
  return getPointFocusPose(
    focus.worldX,
    focus.worldZ,
    BUILDING_FOCUS_LOOK_HEIGHT,
    distance,
    height,
    controls,
  );
}

type BuildingLabelEntry = {
  buildingId: string;
  name: string;
  alias: string;
  accentColor: string;
  isPriority: boolean;
  x: number;
  y: number;
  z: number;
};

function getBuildingAlias(building: Building): string {
  return building.code.trim() || building.name;
}

function toRuntimeGlbName(name: string): string {
  // Colapsa múltiples espacios/saltos de línea en un solo underscore y elimina puntos
  return name.trim().replace(/\s+/g, "_").replace(/\./g, "");
}

// Cache de nombres de nodos de la escena, construido una vez por escena.
// Evita hacer scene.traverse por cada edificio en cada render.
const sceneNameIndex = new WeakMap<Object3D, Map<string, Object3D>>();

function buildSceneNameIndex(scene: Object3D): Map<string, Object3D> {
  const cached = sceneNameIndex.get(scene);
  if (cached) return cached;
  const index = new Map<string, Object3D>();
  scene.traverse((obj) => {
    if (!obj.name) return;
    // Guarda con key = nombre normalizado (trim + collapse espacios + minúsculas)
    const key = obj.name.trim().replace(/\s+/g, " ").toLowerCase();
    if (!index.has(key)) index.set(key, obj);
  });
  sceneNameIndex.set(scene, index);
  return index;
}

function findSceneObjectByModelName(scene: Object3D, modelName: string) {
  // 1. Búsqueda exacta (necesaria para nombres con \n que el GLB preserva)
  const direct = scene.getObjectByName(modelName);
  if (direct) return direct;

  // 2. Versión sin espacios redundantes (trim + collapse múltiples espacios)
  const trimmed = modelName.trim().replace(/\s+/g, " ");
  if (trimmed !== modelName) {
    const byTrimmed = scene.getObjectByName(trimmed);
    if (byTrimmed) return byTrimmed;
  }

  // 3. Versión underscore-normalizada
  const runtimeName = toRuntimeGlbName(modelName);
  const byRuntime = scene.getObjectByName(runtimeName);
  if (byRuntime) return byRuntime;

  // 4. Último recurso: índice normalizado (insensible a mayúsculas/espacios).
  //    Cubre casos donde Blender recortó espacios al exportar el GLB.
  const index = buildSceneNameIndex(scene);
  return index.get(trimmed.toLowerCase()) ?? null;
}

// Umbral de distancia: por encima de este Y la cámara está "lejos" del campus.
// 400 = el usuario aún puede leer etiquetas; 560 = vista general inicial.
const LABEL_LOD_FAR_Y = 400;

const BuildingLabels = memo(function BuildingLabels({
  buildings,
  isMobile = false,
  hidden = false,
}: {
  buildings: Building[];
  isMobile?: boolean;
  hidden?: boolean;
}) {
  const selectedBuilding = useBuildingStore((s) => s.selectedBuilding);
  const setSelectedBuilding = useBuildingStore((s) => s.setSelectedBuilding);
  const setGlbPositions = useBuildingGlbStore((s) => s.setPositions);
  const { scene } = useGLTF(MODEL_PATH);

  // LOD por distancia: desactivar interacción y bajar opacidad cuando la cámara está lejos.
  // useThree y useFrame son seguros aquí porque BuildingLabels siempre renderiza dentro del Canvas.
  const { camera } = useThree();
  const [labelsFaded, setLabelsFaded] = useState(false);
  const prevFadedRef = useRef(false);
  useFrame(() => {
    const isFar = camera.position.y > LABEL_LOD_FAR_Y;
    if (isFar !== prevFadedRef.current) {
      prevFadedRef.current = isFar;
      setLabelsFaded(isFar);
    }
  });

  const labels = useMemo<BuildingLabelEntry[]>(() => {
    // No calcular cuando las etiquetas no se van a mostrar
    if (hidden) return [];

    scene.updateMatrixWorld(true);
    const result: BuildingLabelEntry[] = [];
    const nodeWinner = new Map<string, string>();

    // Reusar objetos Three.js en el loop para evitar allocations por edificio
    const _box = new Box3();
    const _topWorld = new Vector3();

    // Paso 1: decidir qué edificio "gana" la etiqueta de cada nodo GLB.
    for (const building of buildings) {
      if (!building.is_active || !building.model_node_name) continue;
      const glbName = resolveGlbName(building.model_node_name);
      const existing = nodeWinner.get(glbName);
      if (!existing) {
        nodeWinner.set(glbName, building.id);
      } else if (building.is_priority) {
        const prevBuilding = buildings.find((b) => b.id === existing);
        if (!prevBuilding?.is_priority) nodeWinner.set(glbName, building.id);
      }
    }

    // Paso 2: generar solo la etiqueta del edificio ganador por nodo GLB
    for (const building of buildings) {
      if (!building.is_active || !building.model_node_name) continue;

      const glbName = resolveGlbName(building.model_node_name);
      if (nodeWinner.get(glbName) !== building.id) continue;

      const node = findSceneObjectByModelName(scene, glbName);
      if (!node) continue;

      _box.setFromObject(node);
      if (_box.isEmpty()) continue;

      _topWorld.set(
        (_box.min.x + _box.max.x) / 2,
        _box.max.y,
        (_box.min.z + _box.max.z) / 2,
      );
      const local = scene.worldToLocal(_topWorld);
      const accent = getCategoryAccent(building.category_name);

      result.push({
        buildingId: building.id,
        name: building.name,
        alias: getBuildingAlias(building),
        accentColor: building.category_color || accent.fg,
        isPriority: building.is_priority,
        x: local.x,
        y: local.y + 4,
        z: local.z,
      });
    }

    return result;
  }, [scene, buildings, hidden]);

  // Publica las posiciones GLB (centro real del mesh) al store compartido
  useEffect(() => {
    if (labels.length === 0) return;
    const positions: Record<string, { x: number; z: number }> = {};
    for (const label of labels) {
      positions[label.buildingId] = { x: label.x, z: label.z };
    }
    setGlbPositions(positions);
  }, [labels, setGlbPositions]);

  const handleSelect = useCallback(
    (buildingId: string) => {
      const b = buildings.find((bl) => bl.id === buildingId);
      if (b) setSelectedBuilding(b);
    },
    [buildings, setSelectedBuilding],
  );

  if (hidden) return null;

  return (
    <>
      {labels.map((label) => {
        const isSelected = selectedBuilding?.id === label.buildingId;
        if (isMobile && !isSelected && !label.isPriority) return null;
        // Código del edificio: cortar si es muy largo para que nunca rompa en la pill
        const displayCode = label.alias.length > 16
          ? label.alias.slice(0, 15) + "…"
          : label.alias;

        return (
          <Html
            key={label.buildingId}
            position={[label.x, label.y, label.z]}
            zIndexRange={[isSelected ? 6 : 5, 0]}
          >
            <button
              type="button"
              aria-label={label.name}
              title={label.name}
              onClick={() => handleSelect(label.buildingId)}
              style={{
                transform: "translateX(-50%) translateY(-100%)",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                // Ancho explícito en seleccionado — evita que inline-flex colapse
                // al ancho del código chip y fuerce el nombre a romper letra a letra
                width: isSelected ? 175 : "auto",
                padding: isSelected
                  ? "8px 13px"
                  : isMobile ? "7px 12px" : "5px 11px",
                borderRadius: isSelected ? 12 : 999,
                border: `1.5px solid ${
                  isSelected ? label.accentColor : "rgba(255,255,255,0.22)"
                }`,
                background: isSelected
                  ? label.accentColor
                  : "rgba(10,16,32,0.84)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                color: "#ffffff",
                cursor: labelsFaded ? "default" : "pointer",
                boxShadow: isSelected
                  ? `0 6px 24px ${label.accentColor}55, 0 0 0 3px ${label.accentColor}22`
                  : "0 2px 8px rgba(0,0,0,0.5)",
                fontFamily: "Inter, system-ui, sans-serif",
                userSelect: "none",
                // LOD: cuando la cámara está lejos, las etiquetas son decorativas (no interactivas)
                opacity: labelsFaded ? 0.38 : 1,
                pointerEvents: labelsFaded ? "none" : "auto",
                touchAction: "manipulation",
                outline: "none",
                transition: "padding 0.18s ease, border-radius 0.18s ease, box-shadow 0.18s ease, opacity 0.3s ease",
              }}
            >
              {/* Código — siempre visible, nunca rompe */}
              <span
                style={{
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  lineHeight: 1,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {displayCode}
              </span>

              {/* Nombre completo — solo cuando el edificio está seleccionado.
                  wordBreak "normal" + overflowWrap "break-word" = rompe solo en
                  espacios/guiones; solo rompe mid-word si una palabra sola no cabe. */}
              {isSelected && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    textAlign: "center",
                    opacity: 0.94,
                    whiteSpace: "normal",
                    wordBreak: "normal",
                    overflowWrap: "break-word",
                    width: "100%",
                  }}
                >
                  {label.name}
                </span>
              )}
            </button>
          </Html>
        );
      })}
    </>
  );
});

export function CampusViewer({
  isMobile = false,
  mobilePanelOpen = false,
  enableAdminTools = false,
  hideCategoryLegend = false,
  mapXOffset = 0,
}: CampusViewerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const cameraAnimRef = useRef<CameraAnim | null>(null);
  const lastSelectedFocusRef = useRef<{
    buildingId: string;
    x: number;
    z: number;
  } | null>(null);
  // Congela el offset al montar para no saltar la cámara si cambia el sidebar
  const initialXOffsetRef = useRef(mapXOffset);

  const mapPosition = useLocationStore((state) => state.mapPosition);

  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const prevRouteRef = useRef<typeof routeDestination | undefined>(undefined);
  const glbPositions = useBuildingGlbStore((s) => s.positions);

  const adminUser = useAdminAuthStore((state) => state.user);
  const isAdminAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const canUseAdvancedTools =
    isAdminAuthenticated &&
    (adminUser?.role === "superadmin" ||
      (enableAdminTools && adminUser?.role === "admin"));

  const [buildingsVersion, setBuildingsVersion] = useState(0);
  const { buildings } = useBuildings({ admin: canUseAdvancedTools, version: buildingsVersion });
  const [focus, setFocus] = useState<FocusPoint | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("immersive");
  const [campusPosition, setCampusPosition] = useState(() =>
    DEFAULT_CAMPUS_POSITION.clone()
  );
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [isLoadingExiting, setIsLoadingExiting] = useState(false);
  const handleModelLoaded = useCallback(() => setIsModelLoaded(true), []);
  const handleCampusPositionChange = useCallback((nextPosition: Vector3) => {
    setCampusPosition((current) =>
      current.distanceToSquared(nextPosition) < 0.0001
        ? current
        : nextPosition.clone()
    );
  }, []);
  const { progress: loadProgress } = useProgress();
  const [navigationDebugMode, setNavigationDebugMode] =
    useState<NavigationDebugMode>("hidden");
  const [draftEditorActive, setDraftEditorActive] = useState(false);
  const [gpsRecorderOpen, setGpsRecorderOpen] = useState(false);
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const draftEditor = useDraftEditor();

  useEffect(() => {
    if (canUseAdvancedTools) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNavigationDebugMode("hidden");
    setDraftEditorActive(false);
  }, [canUseAdvancedTools]);

  useEffect(() => {
    startUserLocationTracking();
    return () => stopUserLocationTracking();
  }, []);

  useEffect(() => {
    let cancelled = false;
    getActiveCalibrationProfileApi()
      .then((profile) => {
        if (cancelled || !profile) return;
        setActiveGpsTransform({
          ref_lat: profile.ref_lat,
          ref_lng: profile.ref_lng,
          meters_lat: profile.meters_lat,
          meters_lng: profile.meters_lng,
          a_x: profile.a_x,
          b_x: profile.b_x,
          c_x: profile.c_x,
          a_z: profile.a_z,
          b_z: profile.b_z,
          c_z: profile.c_z,
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const pose = getModeCameraPosition(viewMode, isMobile);
    if (isMobile) {
      controls.target.copy(CAMERA_TARGET);
      controls.object.position.copy(pose);
    } else {
      const xOff = getModeXOffset(viewMode, isMobile, initialXOffsetRef.current);
      controls.target.set(xOff, 0, 0);
      controls.object.position.set(xOff, pose.y, pose.z);
    }
    controls.update();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  useEffect(() => {
    if (!focus) return;
    const target = getBuildingFocusPose(focus, isMobile, controlsRef.current);
    cameraAnimRef.current = {
      pos: target.pos,
      look: target.look,
      duration: getCameraMoveDuration(
        controlsRef.current?.object?.position,
        target.pos,
      ),
    };
  }, [focus, isMobile]);

  useEffect(() => {
    if (!selectedBuilding) {
      lastSelectedFocusRef.current = null;
      return;
    }
    if (routeDestination) return;
    const glbPos = glbPositions[selectedBuilding.id];
    const x = glbPos?.x ?? selectedBuilding.x;
    const z = glbPos?.z ?? selectedBuilding.z;
    if (x == null || z == null) return;
    const previous = lastSelectedFocusRef.current;
    if (
      previous?.buildingId === selectedBuilding.id &&
      nearlyEqual(previous.x, x) &&
      nearlyEqual(previous.z, z)
    ) {
      return;
    }
    lastSelectedFocusRef.current = { buildingId: selectedBuilding.id, x, z };
    // Enfocar un edificio siempre implica vista inmersiva: si el usuario
    // estaba en modo aéreo, el acercamiento no debe quedar "a medias"
    // con la cámara aún lejos por culpa del modo previo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViewMode("immersive");
    setFocus(createFocusPoint(x, z, campusPosition));
  // glbPositions se excluye intencionalmente: las posiciones GLB ya están
  // disponibles cuando el usuario puede hacer clic en una etiqueta.
  // Incluirla causaba un segundo enfoque al actualizarse el store.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBuilding, routeDestination, campusPosition]);

  useEffect(() => {
    if (!routeDestination || !mapPosition) return;
    if (routeDestination === prevRouteRef.current) return;
    prevRouteRef.current = routeDestination;

    const userWorld = campusLocalToWorld(mapPosition.x, mapPosition.z, campusPosition);

    // Preferir posición GLB; fallback a coordenadas de la BD
    const glbPos = glbPositions[routeDestination.id];
    const destLocal = glbPos ?? (
      routeDestination.x != null && routeDestination.z != null
        ? { x: routeDestination.x, z: routeDestination.z }
        : null
    );
    const destWorld = destLocal
      ? campusLocalToWorld(destLocal.x, destLocal.z, campusPosition)
      : userWorld;

    const midX = (userWorld.x + destWorld.x) / 2;
    const midZ = (userWorld.z + destWorld.z) / 2;

    const span = Math.sqrt(
      Math.pow(destWorld.x - userWorld.x, 2) +
        Math.pow(destWorld.z - userWorld.z, 2),
    );
    const camHeight = Math.min(Math.max(span * 0.85 + 50, 70), 210);
    const pullZ = isMobile ? 35 : 12;

    setViewMode("immersive");
    cameraAnimRef.current = {
      pos: new Vector3(midX, camHeight, midZ + pullZ),
      look: new Vector3(midX, 0, midZ),
    };
  }, [routeDestination, mapPosition, isMobile, glbPositions, campusPosition]);

  const isContentReady = isModelLoaded && buildings.length > 0;
  useEffect(() => {
    if (!isContentReady) return;
    const t1 = setTimeout(() => setIsLoadingExiting(true), 50);
    const t2 = setTimeout(() => setShowLoading(false), 430);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isContentReady]);

  const handleFocusUser = () => {
    if (!mapPosition) return;
    lastSelectedFocusRef.current = null;
    setViewMode("immersive");
    setFocus(createFocusPoint(mapPosition.x, mapPosition.z, campusPosition));
  };

  const handleResetView = () => {
    const xOff = getModeXOffset(viewMode, isMobile, mapXOffset);
    const pose = getModeCameraPosition(viewMode, isMobile);
    lastSelectedFocusRef.current = null;
    setFocus(null);
    cameraAnimRef.current = {
      pos: isMobile ? pose.clone() : new Vector3(xOff, pose.y, pose.z),
      look: new Vector3(xOff, 0, 0),
    };
  };

  const handleToggleViewMode = () => {
    const nextMode: ViewMode = viewMode === "immersive" ? "aerial" : "immersive";
    const xOff = getModeXOffset(nextMode, isMobile, mapXOffset);
    const pose = getModeCameraPosition(nextMode, isMobile);
    lastSelectedFocusRef.current = null;
    setFocus(null);
    setViewMode(nextMode);
    cameraAnimRef.current = {
      pos: isMobile ? pose.clone() : new Vector3(xOff, pose.y, pose.z),
      look: new Vector3(xOff, 0, 0),
    };
  };

  // Clic/tap en el mapa durante el modo aéreo: "aterriza" ahí en modo
  // inmersivo, con la misma distancia/altura que usa la vista inmersiva
  // por defecto para que se sienta consistente.
  const handleAerialTeleport = useCallback(
    (worldX: number, worldZ: number) => {
      const immersivePose = getModeCameraPosition("immersive", isMobile);
      const target = getPointFocusPose(
        worldX,
        worldZ,
        0,
        immersivePose.z,
        immersivePose.y,
        controlsRef.current,
      );
      lastSelectedFocusRef.current = null;
      setFocus(null);
      setViewMode("immersive");
      cameraAnimRef.current = {
        pos: target.pos,
        look: target.look,
        duration: getCameraMoveDuration(controlsRef.current?.object?.position, target.pos),
      };
    },
    [isMobile],
  );

  const handleZoom = (delta: number) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const offset = controls.object.position.clone().sub(controls.target);
    const factor = delta > 0 ? 1.18 : 0.82;
    offset.multiplyScalar(factor);
    const length = offset.length();
    if (length < (controls.minDistance ?? 20)) return;
    if (length > (controls.maxDistance ?? 350)) return;
    controls.object.position.copy(controls.target).add(offset);
    controls.update();
  };

  const hasLocation = mapPosition !== null;
  const showNavigationDebug = navigationDebugMode !== "hidden";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        cursor: draftEditorActive
          ? "crosshair"
          : viewMode === "aerial"
            ? "pointer"
            : undefined,
      }}
    >
      <LocationSync buildings={buildings} />

      {!mobilePanelOpen && (
        <ViewerToolbar
          hasLocation={hasLocation}
          navigationDebugMode={navigationDebugMode}
          draftEditorActive={draftEditorActive}
          gpsRecorderOpen={gpsRecorderOpen}
          calibrationOpen={calibrationOpen}
          onFocusUser={handleFocusUser}
          onResetView={handleResetView}
          onZoom={handleZoom}
          viewMode={viewMode}
          onToggleViewMode={handleToggleViewMode}
          onToggleNavigationDebug={() =>
            setNavigationDebugMode((current) => {
              if (current === "hidden") return "all";
              if (current === "all") return "issues";
              return "hidden";
            })
          }
          onToggleDraftEditor={() => setDraftEditorActive((current) => !current)}
          onToggleGpsRecorder={() => setGpsRecorderOpen((current) => !current)}
          onToggleCalibration={() => setCalibrationOpen((current) => !current)}
          canUseAdvancedTools={canUseAdvancedTools}
          isMobile={isMobile}
        />
      )}

      {canUseAdvancedTools && gpsRecorderOpen && (
        <SetBuildingGpsPanel
          buildings={buildings}
          onClose={() => setGpsRecorderOpen(false)}
          onBuildingUpdated={() => setBuildingsVersion((v) => v + 1)}
        />
      )}

      {canUseAdvancedTools && calibrationOpen && (
        <CampusCalibrationPanel
          buildings={buildings}
          onClose={() => setCalibrationOpen(false)}
        />
      )}

      {canUseAdvancedTools && !isMobile && !mobilePanelOpen && !hideCategoryLegend && (
        <CategoryLegend buildings={buildings} />
      )}

      {showLoading && <ViewerLoading isExiting={isLoadingExiting} progress={loadProgress} />}

      {canUseAdvancedTools && draftEditorActive && (
        <NavigationEditorModal
          controls={draftEditor}
          buildings={buildings}
          onClose={() => setDraftEditorActive(false)}
        />
      )}

      <Canvas
        frameloop="demand"
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ antialias: !isMobile, powerPreference: "high-performance", alpha: true }}
        camera={{
          position: isMobile
            ? MOBILE_IMMERSIVE_CAMERA_POSITION.toArray()
            : DESKTOP_IMMERSIVE_CAMERA_POSITION.toArray(),
          fov: 45,
          near: 1,
          far: 5000,
        }}
      >
        <ambientLight intensity={1.4} />
        <hemisphereLight args={["#ffedd5", "#94a3b8", 0.75]} />
        <directionalLight
          position={[160, 280, 120]}
          intensity={2.1}
          castShadow={false}
        />

        <OrbitControls
          ref={controlsRef}
          minPolarAngle={Math.PI / 14}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={20}
          maxDistance={700}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.75}
        />
        <CameraAnimator animRef={cameraAnimRef} controlsRef={controlsRef} />
        <CameraConstraints controlsRef={controlsRef} />
        <AerialTeleportLayer
          active={viewMode === "aerial" && !draftEditorActive}
          onTeleport={handleAerialTeleport}
        />

        <Suspense fallback={null}>
          <CampusBoundsSync
            onPositionChange={handleCampusPositionChange}
            controlsRef={controlsRef}
            isMobile={isMobile}
            mapXOffset={mapXOffset}
            viewMode={viewMode}
          />
          <group
            rotation={[0, CAMPUS_ROTATION_Y, 0]}
            position={campusPosition}
          >
            <CampusModel />
            <ModelLoadedSignal onLoaded={handleModelLoaded} />
            <BuildingLabels
              buildings={buildings}
              isMobile={isMobile}
              hidden={mobilePanelOpen}
            />
            {canUseAdvancedTools && showNavigationDebug && !draftEditorActive && (
              <NavigationDebugLayer showOnlyIssues={navigationDebugMode === "issues"} />
            )}
            {canUseAdvancedTools && (
              <NavigationDraftEditorLayer
                active={draftEditorActive}
                controls={draftEditor}
              />
            )}
            <RouteLine />
            <DestinationBuildingHighlight />
            <UserLocationMarker />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
