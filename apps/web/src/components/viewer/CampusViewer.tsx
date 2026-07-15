import { Suspense, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useProgress } from "@react-three/drei";
import { ACESFilmicToneMapping, Box3, MOUSE, SRGBColorSpace, TOUCH, Vector3, type Object3D } from "three";
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
import { GateMarkers } from "./GateMarkers";
import {
  GatePlacementLayer,
  type GatePlacementPosition,
} from "./GatePlacementLayer";
import { resolveGlbName, toRuntimeGlbName } from "./glb-utils";
import { useBuildingGlbStore } from "../../store/building-glb-store";
import { CameraAnimator, type CameraAnim } from "./CameraAnimator";
import { CampusModel } from "./CampusModel";
import { useCampusGltf } from "./useCampusGltf";
import { useSharedPointerDownTracker } from "./useDragAwareClick";
import { CategoryLegend } from "./CategoryLegend";
import { UserLocationMarker } from "./UserLocationMarker";
import { ViewerLoading } from "./ViewerLoading";
import { ViewerToolbar, type NavigationDebugMode } from "./ViewerToolbar";
import { useInputProfile } from "../../hooks/useInputProfile";

const CAMPUS_ROTATION_Y = Math.PI / 2;
const DEFAULT_CAMPUS_POSITION = new Vector3(0, 0, 0);

export type ViewMode = "immersive" | "aerial";

// Modo inmersivo (por defecto): cerca del suelo, "dentro" del mapa, para
// distinguir fachadas mientras se navega. Ángulo de picado pronunciado
// (Y alto vs. Z) para que el cielo vacío no domine el encuadre. Posición y
// objetivo capturados con el botón de dev "Copiar cámara" apuntando a
// Dirección, en vez de mirar al origen del mundo (0,0,0). El mismo punto de
// interés se usa en móvil; la posición de cámara móvil escala la distancia
// desktop→objetivo por el mismo factor que ya se usaba entre ambos modos
// (~1.22x) — estimado, no capturado en un teléfono real.
const DESKTOP_IMMERSIVE_CAMERA_POSITION = new Vector3(-30.1, 15.0, 110.0);
const IMMERSIVE_TARGET = new Vector3(10.3, 8.0, 70.1);
const MOBILE_IMMERSIVE_CAMERA_POSITION = new Vector3(-39.0, 16.5, 118.8);
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
// Distancia/altura al enfocar un edificio seleccionado: debe quedar MÁS
// cerca que la vista inmersiva por defecto (~57u desktop / ~69u móvil) para
// que seleccionar un edificio se sienta como un acercamiento, no un alejamiento.
const BUILDING_FOCUS_DESKTOP_DISTANCE = 42;
const BUILDING_FOCUS_MOBILE_DISTANCE = 55;
const BUILDING_FOCUS_DESKTOP_HEIGHT = 28;
const BUILDING_FOCUS_MOBILE_HEIGHT = 36;
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

// Punto al que mira la cámara por defecto en cada modo. El modo inmersivo
// (móvil y escritorio) mira a un punto fijo del campus (Dirección); el modo
// aéreo sigue mirando al origen del mundo (0,0,0), como antes.
function getModeCameraTarget(mode: ViewMode): Vector3 {
  return mode === "immersive" ? IMMERSIVE_TARGET : CAMERA_TARGET;
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

type HoveredBuilding = {
  buildingId: string;
  position: [number, number, number];
};

type CampusViewerProps = {
  isMobile?: boolean;
  mobilePanelOpen?: boolean;
  enableAdminTools?: boolean;
  hideCategoryLegend?: boolean;
  /** Pan horizontal (world-X) para centrar el campus en el área visible
   *  cuando un sidebar lo cubre. Negativo = desplaza campus a la derecha en pantalla. */
  mapXOffset?: number;
  gatePlacementPosition?: GatePlacementPosition | null;
  onGatePlacementChange?: (position: GatePlacementPosition) => void;
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
  // El padre pasa initialXOffsetRef.current (congelado al montar), no el
  // mapXOffset en vivo — este efecto hace un camera.position.set() sin
  // animar, así que si reaccionara al offset en vivo, cada vez que se
  // colapsa/expande el sidebar la cámara "saltaría" de vuelta a la pose
  // canónica en lugar de solo desplazarse (se veía como un zoom errático).
  mapXOffset?: number;
  viewMode: ViewMode;
}) {
  const { scene } = useCampusGltf();
  const { camera, invalidate } = useThree();

  useEffect(() => {
    onPositionChange(getCenteredCampusPosition(scene));

    // Pose inicial según el modo de vista activo: inmersiva (cerca del
    // suelo, "dentro" del mapa) o aérea (encuadra todo el campus).
    const pose = getModeCameraPosition(viewMode, isMobile);
    const target = getModeCameraTarget(viewMode);
    const xOff = getModeXOffset(viewMode, isMobile, mapXOffset);
    camera.position.set(pose.x + xOff, pose.y, pose.z);
    if (controlsRef.current) {
      controlsRef.current.target.set(target.x + xOff, target.y, target.z);
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

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
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
  x: number;
  y: number;
  z: number;
  worldX: number;
  worldY: number;
  worldZ: number;
};

function getBuildingAlias(building: Building): string {
  return building.code.trim() || building.name;
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

// Distancia 3D (mundo) cámara↔edificio por debajo de la cual esa etiqueta en
// particular expande a nombre completo. Es POR EDIFICIO (no por altura global
// de cámara): en una vista inmersiva la cámara puede estar baja pero mirando
// a lo lejos, y esos edificios lejanos deben seguir mostrando solo su código.
// 42 = distancia de auto-foco al seleccionar un edificio (BUILDING_FOCUS_*_DISTANCE);
// 90 da un pequeño margen para revelar el par de vecinos más próximos también.
const LABEL_LAYOUT_RECHECK_DISTANCE = 3;

// Solo recalcula el set de "cercanos" si la cámara se movió al menos esto
// desde la última revisión — evita recorrer todas las etiquetas cada frame
// mientras la cámara está quieta o se mueve por debajo del umbral útil.
// Aire mínimo (px) entre dos etiquetas expandidas para que no se sientan
// pegadas, además de no solaparse literalmente.
const LABEL_COLLISION_MARGIN = 16;

// Compara los rects REALES del DOM (no una estimación de tamaño) — así se
// adapta automáticamente a nombres largos que rompen en 2-3 líneas.
function rectsCollide(a: DOMRect, b: DOMRect, margin: number): boolean {
  return !(
    a.right + margin < b.left ||
    a.left - margin > b.right ||
    a.bottom + margin < b.top ||
    a.top - margin > b.bottom
  );
}

const BuildingLabels = memo(function BuildingLabels({
  buildings,
  isMobile = false,
  hidden = false,
  hoverHiddenBuildingId = null,
}: {
  buildings: Building[];
  isMobile?: boolean;
  hidden?: boolean;
  hoverHiddenBuildingId?: string | null;
}) {
  const selectedBuilding = useBuildingStore((s) => s.selectedBuilding);
  const setSelectedBuilding = useBuildingStore((s) => s.setSelectedBuilding);
  const setGlbPositions = useBuildingGlbStore((s) => s.setPositions);
  const { scene } = useCampusGltf();

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
      // Capturar coords de mundo ANTES de worldToLocal, que muta _topWorld in-place.
      const worldX = _topWorld.x;
      const worldY = _topWorld.y;
      const worldZ = _topWorld.z;
      const local = scene.worldToLocal(_topWorld);
      const accent = getCategoryAccent(building.category_name);

      result.push({
        buildingId: building.id,
        name: building.name,
        alias: getBuildingAlias(building),
        accentColor: building.category_color || accent.fg,
        worldX,
        worldY,
        worldZ,
        x: local.x,
        y: local.y + 4,
        z: local.z,
      });
    }

    return result;
  }, [scene, buildings, hidden]);

  // LOD: desactivar interacción y bajar opacidad cuando la cámara está lejos
  // de TODO el campus (altura global). Independiente de esto, cada etiqueta
  // decide su propio nombre-vs-código según su distancia 3D a la cámara
  // (nearBuildingIds) — así en una vista inmersiva solo los edificios
  // realmente cercanos expanden a nombre completo, no todos los visibles.
  // useThree y useFrame son seguros aquí porque BuildingLabels siempre renderiza dentro del Canvas.
  const { camera } = useThree();
  const [labelsFaded, setLabelsFaded] = useState(false);
  const prevFadedRef = useRef(false);
  const [labelLayoutRevision, setLabelLayoutRevision] = useState(0);
  const lastNearCheckPosRef = useRef<Vector3 | null>(null);
  useFrame(() => {
    const isFar = camera.position.y > LABEL_LOD_FAR_Y;
    if (isFar !== prevFadedRef.current) {
      prevFadedRef.current = isFar;
      setLabelsFaded(isFar);
    }

    const lastPos = lastNearCheckPosRef.current;
    if (
      lastPos &&
      lastPos.distanceToSquared(camera.position) <
        LABEL_LAYOUT_RECHECK_DISTANCE * LABEL_LAYOUT_RECHECK_DISTANCE
    ) {
      return;
    }
    lastNearCheckPosRef.current = camera.position.clone();
    setLabelLayoutRevision((revision) => revision + 1);

    // Candidatos dentro del radio de "cerca" — solo distancia 3D. La
    // colisión visual entre ellos se resuelve aparte, con medidas reales
    // del DOM (ver el useLayoutEffect de abajo), no con una estimación.
  });

  // Segunda pasada: de los candidatos "cercanos" (arriba), algunos pueden
  // seguir viéndose amontonados entre sí en pantalla (edificios contiguos,
  // nombres largos que rompen en varias líneas). En vez de adivinar el
  // tamaño de cada etiqueta, se mide su rect REAL del DOM ya renderizado
  // (útil porque el ancho/alto varía según el nombre) y se oculta el nombre
  // (vuelve a código) de la que colisiona con una de mayor prioridad ya
  // aceptada. Corre en useLayoutEffect (antes del paint) para que el
  // usuario nunca vea el estado sin corregir.
  const labelElsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [hiddenLabelIds, setHiddenLabelIds] = useState<Set<string>>(
    () => new Set(),
  );
  const hiddenLabelIdsRef = useRef<Set<string>>(new Set());
  useLayoutEffect(() => {
    if (labels.length === 0) {
      hiddenLabelIdsRef.current = new Set();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHiddenLabelIds(new Set());
      return;
    }

    const measured: { buildingId: string; distSq: number; rect: DOMRect }[] = [];
    for (const label of labels) {
      if (hoverHiddenBuildingId === label.buildingId) continue;
      const el = labelElsRef.current.get(label.buildingId);
      if (!el || !label) continue;
      const dx = camera.position.x - label.worldX;
      const dy = camera.position.y - label.worldY;
      const dz = camera.position.z - label.worldZ;
      measured.push({
        buildingId: label.buildingId,
        distSq: dx * dx + dy * dy + dz * dz,
        rect: el.getBoundingClientRect(),
      });
    }

    // Prioridad: el más cerca de la cámara gana su lugar primero. Antes el
    // edificio seleccionado siempre iba primero (para proteger su nombre
    // largo de colisionar con un vecino) — pero `showName` está deshabilitado
    // (siempre `false`, solo se muestra el código corto), así que esa regla
    // ya no protegía nada real y solo causaba un bug: el vecino que perdía la
    // colisión quedaba con `pointerEvents:none` (ver más abajo), es decir,
    // imposible de seleccionar mientras siguiera colisionando en pantalla
    // con el edificio ya seleccionado (bug real, ronda 2026-07-15).
    measured.sort((a, b) => a.distSq - b.distSq);

    const accepted: DOMRect[] = [];
    const hidden = new Set<string>();
    for (const m of measured) {
      const collides = accepted.some((r) =>
        rectsCollide(r, m.rect, LABEL_COLLISION_MARGIN),
      );
      if (collides) {
        hidden.add(m.buildingId);
      } else {
        accepted.push(m.rect);
      }
    }

    const updateSet = (
      prev: Set<string>,
      next: Set<string>,
      commit: (value: Set<string>) => void,
    ) => {
      let changed = next.size !== prev.size;
      if (!changed) {
        for (const id of next) {
          if (!prev.has(id)) {
            changed = true;
            break;
          }
        }
      }
      if (changed) commit(next);
    };

    updateSet(hiddenLabelIdsRef.current, hidden, (next) => {
      hiddenLabelIdsRef.current = next;
      setHiddenLabelIds(next);
    });
  }, [
    labels,
    camera,
    labelLayoutRevision,
    hoverHiddenBuildingId,
  ]);

  // Publica las posiciones GLB (centro real del mesh) al store compartido —
  // para TODOS los buildings activos con model_node_name, no solo el que
  // "gana" la etiqueta 2D en el useMemo de arriba. Dos buildings que
  // comparten el mismo nodo físico (ej. un aula y un cubículo en el mismo
  // edificio) deben resolver a la MISMA posición real para pin/beacon/foco
  // de cámara, sin importar cuál "ganó" el nodeWinner — antes el que perdía
  // nunca se cacheaba aquí y su selección caía al x/z crudo de BD, sin
  // calibrar (bug real de AUD-POS/CUB-DOC, ronda 2026-07-15). Efecto
  // independiente de `hidden`/`labels` a propósito: el foco de cámara y el
  // pin de selección deben funcionar aunque las etiquetas 2D estén ocultas.
  useEffect(() => {
    scene.updateMatrixWorld(true);
    const positions: Record<string, { x: number; z: number }> = {};
    const nodePositionCache = new Map<string, { x: number; z: number } | null>();
    const box = new Box3();
    const topWorld = new Vector3();

    for (const building of buildings) {
      if (!building.is_active || !building.model_node_name) continue;
      const glbName = resolveGlbName(building.model_node_name);

      let nodePos = nodePositionCache.get(glbName);
      if (nodePos === undefined) {
        const node = findSceneObjectByModelName(scene, glbName);
        if (node) {
          box.setFromObject(node);
          if (!box.isEmpty()) {
            topWorld.set(
              (box.min.x + box.max.x) / 2,
              box.max.y,
              (box.min.z + box.max.z) / 2,
            );
            const local = scene.worldToLocal(topWorld.clone());
            nodePos = { x: local.x, z: local.z };
          } else {
            nodePos = null;
          }
        } else {
          nodePos = null;
        }
        nodePositionCache.set(glbName, nodePos);
      }

      if (nodePos) positions[building.id] = nodePos;
    }

    if (Object.keys(positions).length > 0) setGlbPositions(positions);
  }, [scene, buildings, setGlbPositions]);

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
        if (hoverHiddenBuildingId === label.buildingId) return null;
        const isCollisionHidden = hiddenLabelIds.has(label.buildingId);

        const showName = false;
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
              ref={(el) => {
                if (el) labelElsRef.current.set(label.buildingId, el);
                else labelElsRef.current.delete(label.buildingId);
              }}
              type="button"
              aria-label={label.name}
              className={`ito-building-label${isSelected ? " is-selected" : ""}${showName ? " has-name" : ""}`}
              onClick={() => handleSelect(label.buildingId)}
              style={{
                transform: "translateX(-50%) translateY(-100%)",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                position: "relative",
                // Ancho explícito cuando se muestra el nombre — evita que
                // inline-flex colapse al ancho del código chip y fuerce el
                // nombre a romper letra a letra
                width: showName ? (isMobile ? 150 : 168) : "auto",
                padding: showName
                  ? "7px 11px"
                  : isMobile ? "7px 12px" : "5px 10px",
                borderRadius: showName ? 10 : 999,
                border: `1.5px solid ${
                  isSelected ? label.accentColor : "rgba(148,163,184,0.32)"
                }`,
                background: isSelected
                  ? "rgba(255,255,255,0.97)"
                  : "rgba(255,255,255,0.92)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                color: "#111827",
                cursor: labelsFaded ? "default" : "pointer",
                boxShadow: isSelected
                  ? `0 10px 28px ${label.accentColor}24, 0 0 0 3px ${label.accentColor}18`
                  : "0 8px 22px rgba(15,23,42,0.16)",
                fontFamily: "Inter, system-ui, sans-serif",
                userSelect: "none",
                // LOD: cuando la cámara está lejos, las etiquetas son decorativas (no interactivas).
                // Ojo: `isCollisionHidden` usa opacity (no `visibility:hidden`) a propósito — un
                // elemento con visibility:hidden nunca recibe clics sin importar pointerEvents, y
                // eso volvía imposible seleccionar un edificio mientras su etiqueta colisionara en
                // pantalla con la del ya seleccionado (bug real, ronda 2026-07-15).
                opacity: isCollisionHidden ? 0 : labelsFaded ? 0.38 : 1,
                pointerEvents: labelsFaded ? "none" : "auto",
                touchAction: "manipulation",
                outline: "none",
                transition: "padding 0.18s ease, border-radius 0.18s ease, box-shadow 0.18s ease, opacity 0.3s ease, transform 0.18s ease",
              }}
            >
              {/* Código — siempre visible, nunca rompe */}
              <span
                style={{
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 800,
                  letterSpacing: 0,
                  lineHeight: 1,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  padding: showName ? "3px 7px" : "0",
                  borderRadius: 999,
                  background: showName ? `${label.accentColor}22` : "transparent",
                  color: showName ? label.accentColor : "#1f2937",
                }}
              >
                {displayCode}
              </span>

              {/* Nombre completo — cuando el edificio está seleccionado o la
                  cámara está cerca (showAllNames). wordBreak "normal" +
                  overflowWrap "break-word" = rompe solo en espacios/guiones;
                  solo rompe mid-word si una palabra sola no cabe. */}
              {showName && (
                <span
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                    fontSize: isMobile ? 10 : 10.5,
                    fontWeight: 600,
                    lineHeight: 1.28,
                    textAlign: "center",
                    opacity: 0.92,
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

function BuildingModelHoverCard({
  hover,
  buildings,
}: {
  hover: HoveredBuilding | null;
  buildings: Building[];
}) {
  if (!hover) return null;

  const building = buildings.find((item) => item.id === hover.buildingId);
  if (!building) return null;

  const accent = building.category_color || getCategoryAccent(building.category_name).fg;
  const code = (building.code.trim() || building.name).slice(0, 18);

  return (
    <Html position={hover.position} zIndexRange={[10, 0]}>
      <div
        className="ito-building-hover-card"
        style={{ "--label-accent": accent } as CSSProperties}
      >
        <span className="ito-building-hover-card__code">{code}</span>
        <span className="ito-building-hover-card__name">{building.name}</span>
      </div>
    </Html>
  );
}

type BuildingHoverTarget = {
  buildingId: string;
  center: [number, number, number];
  size: [number, number, number];
  cardPosition: [number, number, number];
};

function BuildingHoverLayer({
  buildings,
  active,
  onHoverBuilding,
}: {
  buildings: Building[];
  active: boolean;
  onHoverBuilding: (hover: HoveredBuilding | null) => void;
}) {
  const { scene } = useCampusGltf();
  const setSelectedBuilding = useBuildingStore((s) => s.setSelectedBuilding);
  const { handlePointerDown, wasDrag } = useSharedPointerDownTracker();

  const targets = useMemo<BuildingHoverTarget[]>(() => {
    if (!active) return [];

    scene.updateMatrixWorld(true);
    const result: BuildingHoverTarget[] = [];
    const nodeWinner = new Map<string, string>();
    const worldBox = new Box3();
    const worldCenter = new Vector3();
    const worldTop = new Vector3();
    const localCenter = new Vector3();
    const localTop = new Vector3();
    const worldSize = new Vector3();

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

    for (const building of buildings) {
      if (!building.is_active || !building.model_node_name) continue;
      const glbName = resolveGlbName(building.model_node_name);
      if (nodeWinner.get(glbName) !== building.id) continue;

      const node = findSceneObjectByModelName(scene, glbName);
      if (!node) continue;

      worldBox.setFromObject(node);
      if (worldBox.isEmpty()) continue;

      worldBox.getCenter(worldCenter);
      worldBox.getSize(worldSize);
      worldTop.set(worldCenter.x, worldBox.max.y + 12, worldCenter.z);
      localCenter.copy(worldCenter);
      localTop.copy(worldTop);
      scene.worldToLocal(localCenter);
      scene.worldToLocal(localTop);

      result.push({
        buildingId: building.id,
        center: [localCenter.x, localCenter.y, localCenter.z],
        size: [
          Math.max(worldSize.x, 12),
          Math.max(worldSize.y, 10),
          Math.max(worldSize.z, 12),
        ],
        cardPosition: [localTop.x, localTop.y, localTop.z],
      });
    }

    return result;
  }, [active, buildings, scene]);

  if (!active) return null;

  return (
    <>
      {targets.map((target) => {
        const building = buildings.find((item) => item.id === target.buildingId);

        return (
          <mesh
            key={target.buildingId}
            position={target.center}
            onPointerDown={handlePointerDown}
            onPointerOver={(event) => {
              event.stopPropagation();
              onHoverBuilding({
                buildingId: target.buildingId,
                position: target.cardPosition,
              });
            }}
            onPointerMove={(event) => {
              event.stopPropagation();
            }}
            onPointerOut={() => onHoverBuilding(null)}
            onClick={(event) => {
              event.stopPropagation();
              if (wasDrag(event)) return;
              if (building) setSelectedBuilding(building);
            }}
          >
            <boxGeometry args={target.size} />
            <meshBasicMaterial
              transparent
              opacity={0}
              depthWrite={false}
              color="#ffffff"
            />
          </mesh>
        );
      })}
    </>
  );
}

export function CampusViewer({
  isMobile = false,
  mobilePanelOpen = false,
  enableAdminTools = false,
  hideCategoryLegend = false,
  mapXOffset = 0,
  gatePlacementPosition,
  onGatePlacementChange,
}: CampusViewerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const cameraAnimRef = useRef<CameraAnim | null>(null);
  const lastSelectedFocusRef = useRef<{
    buildingId: string;
    x: number;
    z: number;
  } | null>(null);
  const lastSelectedGateRef = useRef<string | null>(null);
  // Congela el offset al montar para no saltar la cámara si cambia el sidebar
  const initialXOffsetRef = useRef(mapXOffset);

  const mapPosition = useLocationStore((state) => state.mapPosition);

  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const selectedGate = useBuildingStore((state) => state.selectedGate);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const clearSelection = useBuildingStore((state) => state.clearSelection);
  const clearRoute = useBuildingStore((state) => state.clearRoute);
  const prevRouteRef = useRef<typeof routeDestination | undefined>(undefined);
  const glbPositions = useBuildingGlbStore((s) => s.positions);
  const inputProfile = useInputProfile();
  const touchOptimized = inputProfile.kind === "phone" || inputProfile.kind === "tablet";
  const gatePlacementActive = Boolean(onGatePlacementChange);

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
  const [hoveredBuilding, setHoveredBuilding] = useState<HoveredBuilding | null>(null);
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

    // Android puede matar la entrega de ubicación en segundo plano aunque el
    // permiso siga "concedido" (solo se otorgó "mientras la app está en
    // uso") — sin esto, el punto azul queda congelado para siempre después
    // de minimizar la app y volver a abrirla. Forzamos parar+arrancar de
    // nuevo cada vez que la pestaña/app vuelve a estar visible.
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      stopUserLocationTracking().then(() => startUserLocationTracking());
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void stopUserLocationTracking();
    };
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
    const target = getModeCameraTarget(viewMode);
    const xOff = getModeXOffset(viewMode, isMobile, initialXOffsetRef.current);
    controls.target.set(target.x + xOff, target.y, target.z);
    controls.object.position.set(pose.x + xOff, pose.y, pose.z);
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
    // Solo cede el control de la cámara a la ruta activa cuando su destino
    // ES el edificio recién seleccionado (flujo normal: seleccionar → "Cómo
    // llegar"). Si difieren -por ejemplo, una nueva búsqueda seleccionó otro
    // edificio mientras había una ruta previa- igual debe enfocar el
    // edificio nuevo en vez de quedarse "trabado" mirando el destino viejo.
    if (routeDestination && routeDestination.id === selectedBuilding.id) return;
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
    if (!selectedGate) {
      lastSelectedGateRef.current = null;
      return;
    }
    if (lastSelectedGateRef.current === selectedGate.id) return;
    lastSelectedGateRef.current = selectedGate.id;
    setViewMode("immersive");
    setFocus(createFocusPoint(selectedGate.x, selectedGate.z, campusPosition));
  }, [selectedGate, campusPosition]);

  useEffect(() => {
    if (!routeDestination || !mapPosition) {
      if (!routeDestination) prevRouteRef.current = null;
      return;
    }
    if (routeDestination.id === prevRouteRef.current?.id) return;
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
    const target = getModeCameraTarget(viewMode);
    lastSelectedFocusRef.current = null;
    setFocus(null);
    cameraAnimRef.current = {
      pos: new Vector3(pose.x + xOff, pose.y, pose.z),
      look: new Vector3(target.x + xOff, target.y, target.z),
    };
  };

  const handleToggleViewMode = () => {
    const nextMode: ViewMode = viewMode === "immersive" ? "aerial" : "immersive";
    const xOff = getModeXOffset(nextMode, isMobile, mapXOffset);
    const pose = getModeCameraPosition(nextMode, isMobile);
    const target = getModeCameraTarget(nextMode);
    lastSelectedFocusRef.current = null;
    setFocus(null);
    setViewMode(nextMode);
    cameraAnimRef.current = {
      pos: new Vector3(pose.x + xOff, pose.y, pose.z),
      look: new Vector3(target.x + xOff, target.y, target.z),
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

  useEffect(() => {
    if (!inputProfile.hasKeyboard || mobilePanelOpen || draftEditorActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "+" || key === "=") {
        event.preventDefault();
        handleZoom(-1);
        return;
      }
      if (key === "-" || key === "_") {
        event.preventDefault();
        handleZoom(1);
        return;
      }
      if (key === "0" || key === "home") {
        event.preventDefault();
        handleResetView();
        return;
      }
      if (key === "v") {
        event.preventDefault();
        handleToggleViewMode();
        return;
      }
      if (key === "l" && hasLocation) {
        event.preventDefault();
        handleFocusUser();
        return;
      }
      if (key === "escape") {
        event.preventDefault();
        clearSelection();
        clearRoute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const hasLocation = mapPosition !== null;
  const showNavigationDebug = navigationDebugMode !== "hidden";
  const canShowHoverDetails = !isMobile && inputProfile.hasFinePointer;

  useEffect(() => {
    if (canShowHoverDetails && !draftEditorActive && !mobilePanelOpen) return;
    setHoveredBuilding(null);
  }, [canShowHoverDetails, draftEditorActive, mobilePanelOpen]);

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

      {import.meta.env.DEV && (
        <button
          type="button"
          onClick={() => {
            const controls = controlsRef.current;
            if (!controls) return;
            const pos = controls.object.position;
            const target = controls.target;
            const text =
              `position: new Vector3(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})\n` +
              `target: new Vector3(${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)})`;
            navigator.clipboard?.writeText(text).catch(() => {});
            console.log(`[dev] pose de cámara copiada:\n${text}`);
          }}
          title="DEV: copiar posición y objetivo actuales de la cámara"
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            zIndex: 50,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #f97316",
            background: "rgba(15,23,42,0.92)",
            color: "#fdba74",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          📷 Copiar cámara
        </button>
      )}

      {!mobilePanelOpen && (
        <ViewerToolbar
          hasLocation={hasLocation}
          navigationDebugMode={navigationDebugMode}
          draftEditorActive={draftEditorActive}
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
          onToggleCalibration={() => setCalibrationOpen((current) => !current)}
          canUseAdvancedTools={canUseAdvancedTools}
          isMobile={isMobile}
        />
      )}

      {canUseAdvancedTools && calibrationOpen && (
        <CampusCalibrationPanel
          buildings={buildings}
          onClose={() => setCalibrationOpen(false)}
          onBuildingUpdated={() => setBuildingsVersion((v) => v + 1)}
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
        dpr={[1, isMobile ? 1.25 : 2]}
        onCreated={({ gl, invalidate }) => {
          gl.outputColorSpace = SRGBColorSpace;
          // ACES conserva detalle en blancos y colores intensos sin "lavar"
          // las texturas bajo varias luces. Una exposición neutra evita que
          // paredes claras pierdan todo su contraste.
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.95;
          invalidate();
        }}
        gl={{
          antialias: !isMobile,
          powerPreference: "high-performance",
          alpha: true,
        }}
        camera={{
          position: isMobile
            ? MOBILE_IMMERSIVE_CAMERA_POSITION.toArray()
            : DESKTOP_IMMERSIVE_CAMERA_POSITION.toArray(),
          fov: 45,
          near: 1,
          far: 2000,
        }}
      >
        {/* Prioridad: legibilidad del mapa, no relieve fotorrealista — todo
            edificio debe verse bien iluminado sin importar desde qué ángulo
            se mire, no solo el lado que da al "sol". La ambiental (pareja en
            toda cara, sin importar orientación) hace el trabajo pesado; la
            direccional se deja solo como acento mínimo para que el modelo no
            se vea completamente sin volumen. */}
        <ambientLight intensity={1.05} />
        <hemisphereLight args={["#fff7ed", "#cbd5e1", 0.65]} />
        <directionalLight
          position={[160, 280, 120]}
          intensity={1.35}
          castShadow={false}
        />
        <directionalLight
          position={[-180, 180, -160]}
          intensity={0.32}
          color="#e0f2fe"
          castShadow={false}
        />
        <directionalLight
          position={[0, 120, -260]}
          intensity={0.2}
          color="#fff7ed"
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
          rotateSpeed={touchOptimized ? 0.58 : 0.75}
          zoomSpeed={touchOptimized ? 0.74 : 1}
          panSpeed={touchOptimized ? 0.72 : 1}
          screenSpacePanning={inputProfile.hasFinePointer}
          mouseButtons={{
            LEFT: MOUSE.ROTATE,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.PAN,
          }}
          touches={{
            ONE: TOUCH.ROTATE,
            TWO: TOUCH.DOLLY_PAN,
          }}
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
            mapXOffset={initialXOffsetRef.current}
            viewMode={viewMode}
          />
          <group
            rotation={[0, CAMPUS_ROTATION_Y, 0]}
            position={campusPosition}
          >
            <CampusModel
              buildings={buildings}
              selectionDisabled={draftEditorActive || gatePlacementActive}
            />
            <BuildingHoverLayer
              buildings={buildings}
              active={canShowHoverDetails && !draftEditorActive && !gatePlacementActive && !mobilePanelOpen}
              onHoverBuilding={setHoveredBuilding}
            />
            {canShowHoverDetails && (
              <BuildingModelHoverCard
                hover={hoveredBuilding}
                buildings={buildings}
              />
            )}
            <ModelLoadedSignal onLoaded={handleModelLoaded} />
            <BuildingLabels
              buildings={buildings}
              isMobile={isMobile}
              hidden={mobilePanelOpen}
              hoverHiddenBuildingId={hoveredBuilding?.buildingId ?? null}
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
            {!gatePlacementActive && <GateMarkers />}
            {gatePlacementActive && onGatePlacementChange && (
              <GatePlacementLayer
                position={gatePlacementPosition ?? null}
                onPositionChange={onGatePlacementChange}
              />
            )}
            <UserLocationMarker />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}

// La precarga (solo aplica a la variante web/WebP) vive en useCampusGltf.ts,
// disparada al importar ese módulo — no puede hacerse aquí a nivel de
// módulo para la variante nativa (KTX2) porque necesita un WebGLRenderer
// real, que todavía no existe antes de montar el <Canvas>.
