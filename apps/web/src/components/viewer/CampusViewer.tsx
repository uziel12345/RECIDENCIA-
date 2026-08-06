import { Suspense, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls, useProgress } from "@react-three/drei";
import { ACESFilmicToneMapping, Box3, MOUSE, SRGBColorSpace, TOUCH, Vector3, type Object3D } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
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
  getCampusStreetsApi,
  getDepartmentsApi,
  type CampusStreet,
  type Department,
} from "@ito-map/shared";
import { CampusCalibrationPanel } from "./CampusCalibrationPanel";
import { getCategoryAccent } from "../ui/categoryAccent";
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
import {
  BUILDING_HIT_TARGET_KEY,
  buildNameToBuildingMap,
  findExactBuildingFromIntersections,
  shouldClearHoverOnPointerOut,
} from "./building-picking";
import { useCampusGltf } from "./useCampusGltf";
import { useSharedPointerDownTracker } from "./useDragAwareClick";
import { CategoryLegend } from "./CategoryLegend";
import { UserLocationMarker } from "./UserLocationMarker";
import { ViewerLoading } from "./ViewerLoading";
import { ViewerToolbar } from "./ViewerToolbar";
import { useInputProfile } from "../../hooks/useInputProfile";
import { AnimatePresence } from "framer-motion";
import { MapTutorialOverlay } from "./tutorial/MapTutorialOverlay";
import { useMapTutorial } from "./tutorial/useMapTutorial";
import { getCenteredObjectPosition } from "./campus-bounds";
import {
  DESKTOP_MAX_CAMERA_DISTANCE,
  getClampedZoomDistance,
  isSameBuildingFocus,
  MOBILE_MAX_CAMERA_DISTANCE,
  type BuildingFocusSnapshot,
} from "./camera-navigation";
import {
  DeviceLocationLayer,
  LOCATION_FEATURE_FLAGS,
  LocationDebugPanel,
  useDeviceLocationStore,
} from "../../features/device-location";
import { CAMPUS_MODEL_ROTATION_Y } from "./map-orientation.config";
import { CompassCameraSync, CompassIndicator } from "./CompassIndicator";
import { StreetLabelCameraSync } from "./CampusStreetLabels";
import { CampusStreetLabels } from "./CampusStreetLabels";
import { MapLayerControls } from "./MapLayerControls";
import {
  formatBuildingDisplayCode,
  formatBuildingDisplayName,
} from "../../features/buildings/utils/building-display-name";

const CAMPUS_ROTATION_Y = CAMPUS_MODEL_ROTATION_Y;
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
// de acercarse a una zona. Posición y objetivo capturados con el botón de
// dev "Copiar cámara" — misma vista fija para escritorio y móvil (a
// diferencia del modo inmersivo, aquí no hay un ajuste de distancia
// separado por dispositivo). La captura se hizo con el sidebar de
// escritorio expandido (mapXOffset=-75), así que el x crudo ya traía
// sumado ese desplazamiento (-75 * AERIAL_XOFFSET_SCALE = -116.25) — se le
// resta aquí para guardar la base SIN desplazar; `getModeXOffset` vuelve a
// sumarlo en vivo según el estado real del sidebar. Guardar el valor crudo
// tal cual habría duplicado el desplazamiento y descentrado la vista al
// colapsar el sidebar.
const AERIAL_CAMERA_POSITION = new Vector3(12.8 + 116.25, 183.6, 44.1);
const CAMERA_TARGET = new Vector3(15.0 + 116.25, 2.9, 3.0);
// El desplazamiento horizontal que compensa el sidebar (mapXOffset) está
// calibrado para la distancia de la cámara inmersiva. La vista aérea está
// más lejos del objetivo, así que el mismo desplazamiento en unidades de
// mundo se ve proporcionalmente más pequeño en pantalla — se escala para
// que el campus quede igual de centrado en ambos modos.
const AERIAL_XOFFSET_SCALE = 1.55;
// En escritorio el sidebar flotante cubre la izquierda del canvas (que
// ocupa todo el ancho de la ventana, el sidebar es un overlay, no reduce
// su tamaño) — mapXOffset compensa eso. En móvil no hay sidebar, pero la
// barra flotante de controles (zoom/aérea/info) cubre una franja angosta
// del borde derecho del mismo canvas a pantalla completa; sin compensar,
// el objetivo de la cámara queda centrado en el canvas completo en vez de
// en el área realmente visible, y el contenido importante se recorta bajo
// esa barra. Calibrado a mano: ~56px de barra sobre 390px de viewport en
// vista aérea, a una altura de cámara de ~184u con FOV vertical 45°.
const MOBILE_AERIAL_XOFFSET = 6;
// Distancia/altura al enfocar un edificio seleccionado: debe quedar MÁS
// cerca que la vista inmersiva por defecto (~57u desktop / ~69u móvil) para
// que seleccionar un edificio se sienta como un acercamiento, no un alejamiento.
const BUILDING_FOCUS_DESKTOP_DISTANCE = 42;
const BUILDING_FOCUS_MOBILE_DISTANCE = 55;
const BUILDING_FOCUS_DESKTOP_HEIGHT = 28;
const BUILDING_FOCUS_MOBILE_HEIGHT = 36;
const BUILDING_FOCUS_LOOK_HEIGHT = 8;
const DESKTOP_MIN_CAMERA_DISTANCE = 20;
const MOBILE_MIN_CAMERA_DISTANCE = 18;

function getModeCameraPosition(mode: ViewMode, isMobile: boolean): Vector3 {
  if (mode === "aerial") return AERIAL_CAMERA_POSITION;
  return isMobile ? MOBILE_IMMERSIVE_CAMERA_POSITION : DESKTOP_IMMERSIVE_CAMERA_POSITION;
}

// Punto al que mira la cámara por defecto en cada modo. El modo inmersivo
// (móvil y escritorio) mira a un punto fijo del campus (Dirección); el modo
// aéreo mira a su propio punto fijo (ver AERIAL_CAMERA_POSITION).
function getModeCameraTarget(mode: ViewMode): Vector3 {
  return mode === "immersive" ? IMMERSIVE_TARGET : CAMERA_TARGET;
}

// Desplazamiento horizontal de la cámara/objetivo según el dispositivo y el
// modo — cada uno compensa un overlay flotante distinto que cubre parte del
// mismo canvas a pantalla completa (sidebar en escritorio, barra de
// controles en móvil). Centralizar la detección de dispositivo acá evita
// que cada llamador tenga que saber cuál overlay aplica en cada caso.
function getModeXOffset(
  mode: ViewMode,
  isMobile: boolean,
  mapXOffset: number,
): number {
  if (isMobile) {
    return mode === "aerial" ? MOBILE_AERIAL_XOFFSET : 0;
  }
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
  // campus.glb ocupa aprox. 316×285 unidades después de centrar y rotar.
  // Este margen permite recorrer sus bordes sin dejar que el pan táctil lleve
  // el objetivo cientos de unidades hacia una zona completamente blanca.
  minX: -190,  maxX: 190,
  minZ: -175,  maxZ: 175,
  minTargetY: -20, maxTargetY: 160,
  minCamY: 15,
};

function CameraConstraints({
  controlsRef,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
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
// de un arrastre de OrbitControls.
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
      // Usar click (no pointerup) es importante: los edificios detienen la
      // propagación de su propio click, de modo que tocar uno nunca activa
      // también este plano y nunca crea dos destinos de cámara en competencia.
      onClick={(event) => {
        const start = pointerStartRef.current;
        pointerStartRef.current = null;
        if (!start) return;
        const movement = Math.hypot(
          event.nativeEvent.clientX - start.clientX,
          event.nativeEvent.clientY - start.clientY,
        );
        if (movement > MAX_TELEPORT_CLICK_MOVEMENT_PX) return;
        event.stopPropagation();
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
};

type CampusViewerProps = {
  isMobile?: boolean;
  mobilePanelOpen?: boolean;
  enableAdminTools?: boolean;
  enableLocationCalibrationTools?: boolean;
  hideCategoryLegend?: boolean;
  /** Pan horizontal (world-X) para centrar el campus en el área visible
   *  cuando un sidebar lo cubre. Negativo = desplaza campus a la derecha en pantalla. */
  mapXOffset?: number;
  gatePlacementPosition?: GatePlacementPosition | null;
  onGatePlacementChange?: (position: GatePlacementPosition) => void;
};

function getCenteredCampusPosition(scene: Object3D) {
  return getCenteredObjectPosition(
    scene,
    CAMPUS_ROTATION_Y,
    DEFAULT_CAMPUS_POSITION,
  );
}

function CampusBoundsSync({
  onPositionChange,
  controlsRef,
  isMobile,
  mapXOffset = 0,
}: {
  onPositionChange: (position: Vector3) => void;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  isMobile: boolean;
  // El padre pasa initialXOffsetRef.current (congelado al montar), no el
  // mapXOffset en vivo — este efecto hace un camera.position.set() sin
  // animar, así que si reaccionara al offset en vivo, cada vez que se
  // colapsa/expande el sidebar la cámara "saltaría" de vuelta a la pose
  // canónica en lugar de solo desplazarse (se veía como un zoom errático).
  mapXOffset?: number;
}) {
  const { scene } = useCampusGltf();
  const { camera, invalidate } = useThree();

  useEffect(() => {
    onPositionChange(getCenteredCampusPosition(scene));

    // Este efecto establece únicamente la pose inicial. Los cambios de modo
    // los anima handleToggleViewMode; reaccionar aquí a viewMode teletransportaba
    // la cámara y hacía que las etiquetas recalcularan dos veces.
    const pose = getModeCameraPosition("immersive", isMobile);
    const target = getModeCameraTarget("immersive");
    const xOff = getModeXOffset("immersive", isMobile, mapXOffset);
    camera.position.set(pose.x + xOff, pose.y, pose.z);
    if (controlsRef.current) {
      controlsRef.current.target.set(target.x + xOff, target.y, target.z);
    }
    controlsRef.current?.update();
    invalidate();
  }, [scene, onPositionChange, camera, invalidate, controlsRef, isMobile, mapXOffset]);

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
  // Una selección puede ocurrir mientras el GLB todavía publica sus límites
  // y posiciones. Mantener el destino provisional dentro del campus evita
  // que CameraConstraints cambie únicamente el target y deje la cámara lejos,
  // mirando el modelo como una franja en el horizonte.
  const targetLook = new Vector3(
    Math.min(CAMPUS_LIMIT.maxX, Math.max(CAMPUS_LIMIT.minX, worldX)),
    Math.min(CAMPUS_LIMIT.maxTargetY, Math.max(CAMPUS_LIMIT.minTargetY, lookHeight)),
    Math.min(CAMPUS_LIMIT.maxZ, Math.max(CAMPUS_LIMIT.minZ, worldZ)),
  );

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
  isPriority: boolean;
  departmentNames: string[];
};

function getBuildingAlias(building: Building): string {
  return formatBuildingDisplayCode(building.code, building.name);
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

// Recalcular la distribución de etiquetas solo al mover suficientemente la
// cámara; el hover y la selección disparan su propia revisión inmediata.
const LABEL_LAYOUT_RECHECK_DISTANCE = 3;

// Solo recalcula el set de "cercanos" si la cámara se movió al menos esto
// desde la última revisión — evita recorrer todas las etiquetas cada frame
// mientras la cámara está quieta o se mueve por debajo del umbral útil.
// Aire mínimo (px) entre dos etiquetas expandidas para que no se sientan
// pegadas, además de no solaparse literalmente.
const LABEL_COLLISION_MARGIN = 16;
const LABEL_OVERLAY_MARGIN = 8;

// Compara los rects REALES del DOM (no una estimación de tamaño) — así se
// adapta automáticamente a nombres largos que rompen en 2-3 líneas.
type ScreenRect = Pick<DOMRect, "left" | "right" | "top" | "bottom">;

function rectsCollide(a: ScreenRect, b: ScreenRect, margin: number): boolean {
  return !(
    a.right + margin < b.left ||
    a.left - margin > b.right ||
    a.bottom + margin < b.top ||
    a.top - margin > b.bottom
  );
}

// Las etiquetas 3D se renderizan en portales HTML y no participan en el flujo
// de los paneles del visor. Esta lista convierte cada control o ventana visible
// en una zona reservada para que ningún rótulo aparezca detrás de ella.
const MAP_OVERLAY_EXCLUSION_SELECTOR = [
  ".ito-map-search-overlay",
  ".ito-search-dropdown",
  ".ito-toolbar",
  ".ito-compass",
  ".ito-layer-controls",
  ".ito-sidebar-toggle",
  ".student-page__sidebar",
  ".visitor-page__sidebar",
  ".student-top-bar",
  ".visitor-top-bar",
  ".ito-mobile-bar",
  ".ito-sheet",
  ".campus-mobile-modal",
  ".ito-quick-card",
  ".visitor-mobile__search-result",
].join(",");

function getVisibleMapOverlayRects(): ScreenRect[] {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return [];
  }

  const overlays = document.querySelectorAll<HTMLElement>(
    MAP_OVERLAY_EXCLUSION_SELECTOR,
  );
  const rects: ScreenRect[] = [];

  for (const overlay of overlays) {
    const style = window.getComputedStyle(overlay);
    const opacity = Number.parseFloat(style.opacity || "1");
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      opacity <= 0.02
    ) {
      continue;
    }

    const rect = overlay.getBoundingClientRect();
    if (
      rect.width <= 0 ||
      rect.height <= 0 ||
      rect.right <= 0 ||
      rect.bottom <= 0 ||
      rect.left >= window.innerWidth ||
      rect.top >= window.innerHeight
    ) {
      continue;
    }

    rects.push(rect);
  }

  return rects;
}


const BuildingLabels = memo(function BuildingLabels({
  buildings,
  departments,
  isMobile = false,
  hidden = false,
  isAerial = false,
  layoutFrozen = false,
  hoveredBuildingId = null,
  onSelectBuilding,
}: {
  buildings: Building[];
  departments: Department[];
  isMobile?: boolean;
  hidden?: boolean;
  isAerial?: boolean;
  layoutFrozen?: boolean;
  hoveredBuildingId?: string | null;
  onSelectBuilding: (building: Building) => void;
}) {
  const selectedBuilding = useBuildingStore((s) => s.selectedBuilding);
  const setGlbPositions = useBuildingGlbStore((s) => s.setPositions);
  const { scene } = useCampusGltf();
  const [labelPreviewBuildingId, setLabelPreviewBuildingId] = useState<
    string | null
  >(null);
  const labelPreviewCloseTimerRef = useRef<number | null>(null);

  const cancelLabelPreviewClose = useCallback(() => {
    if (labelPreviewCloseTimerRef.current === null) return;
    window.clearTimeout(labelPreviewCloseTimerRef.current);
    labelPreviewCloseTimerRef.current = null;
  }, []);

  const openLabelPreview = useCallback(
    (buildingId: string) => {
      cancelLabelPreviewClose();
      setLabelPreviewBuildingId(buildingId);
    },
    [cancelLabelPreviewClose],
  );

  const scheduleLabelPreviewClose = useCallback(
    (buildingId: string) => {
      cancelLabelPreviewClose();
      // La misma etiqueta cambia de tamaño al revelar el nombre. Este margen
      // absorbe cualquier pointerleave transitorio durante ese reflow y evita
      // el ciclo abrir/cerrar que se percibía como parpadeo.
      labelPreviewCloseTimerRef.current = window.setTimeout(() => {
        labelPreviewCloseTimerRef.current = null;
        setLabelPreviewBuildingId((current) =>
          current === buildingId ? null : current,
        );
      }, 220);
    },
    [cancelLabelPreviewClose],
  );

  useEffect(() => {
    const closePreviewOutsideLabel = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest(".ito-building-label")
      ) {
        return;
      }
      cancelLabelPreviewClose();
      setLabelPreviewBuildingId(null);
    };

    document.addEventListener("pointerdown", closePreviewOutsideLabel, true);
    return () => {
      document.removeEventListener("pointerdown", closePreviewOutsideLabel, true);
      cancelLabelPreviewClose();
    };
  }, [cancelLabelPreviewClose]);

  // El edificio bajo el puntero debe poder revelar su nombre incluso cuando
  // ya existe otro edificio seleccionado. La interacción directa con la
  // etiqueta tiene la prioridad más alta, después el hover del modelo y, al
  // retirar el puntero, se restaura automáticamente la etiqueta seleccionada.
  // Sigue existiendo un único rótulo por edificio y la colisión se resuelve
  // con el mismo algoritmo de abajo.
  const expandedBuildingId =
    labelPreviewBuildingId ?? hoveredBuildingId ?? selectedBuilding?.id ?? null;

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
        name: formatBuildingDisplayName(building.name, building.code),
        alias: getBuildingAlias(building),
        accentColor: building.category_color || accent.fg,
        worldX,
        worldY,
        worldZ,
        x: local.x,
        y: local.y + 4,
        z: local.z,
        isPriority: building.is_priority,
        departmentNames: departments
          .filter((department) => department.building_id === building.id && department.is_active)
          .map((department) => department.name),
      });
    }

    return result;
  }, [scene, buildings, departments, hidden]);

  // LOD: bajar opacidad cuando la cámara está lejos de todo el campus. La
  // etiqueta seleccionada permanece legible; únicamente la pill visible
  // recibe eventos para revelar su nombre.
  // useThree y useFrame son seguros aquí porque BuildingLabels siempre renderiza dentro del Canvas.
  const { camera } = useThree();
  const [labelsFaded, setLabelsFaded] = useState(false);
  const prevFadedRef = useRef(false);
  const [labelLayoutRevision, setLabelLayoutRevision] = useState(0);
  const lastNearCheckPosRef = useRef<Vector3 | null>(null);
  useFrame(() => {
    // En móvil no atenuar todas las etiquetas al entrar en aérea: el cambio
    // masivo de opacidad durante la animación se percibía como parpadeo.
    const isFar = !isMobile && (isAerial || camera.position.y > LABEL_LOD_FAR_Y);
    if (isFar !== prevFadedRef.current) {
      prevFadedRef.current = isFar;
      setLabelsFaded(isFar);
    }

    // OrbitControls y CameraAnimator actualizan la posición HTML de cada
    // etiqueta de forma imperativa. Medir además todos sus rectángulos y
    // provocar un render de React en cada frame era el cuello de botella de
    // la vista aérea. Conservamos el layout mientras la cámara se mueve y lo
    // resolvemos una sola vez cuando termina.
    if (layoutFrozen) {
      if (lastNearCheckPosRef.current) {
        lastNearCheckPosRef.current.copy(camera.position);
      } else {
        lastNearCheckPosRef.current = camera.position.clone();
      }
      return;
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

  // Segunda pasada: se miden los rectángulos reales del DOM. La etiqueta
  // expandida (selección o hover) conserva prioridad y las que se solapan se
  // ocultan temporalmente. Nunca se desplazan: cada etiqueta permanece
  // anclada sobre su edificio aunque la cámara se mueva.
  const labelElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [hiddenLabelIds, setHiddenLabelIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [overlayHiddenLabelIds, setOverlayHiddenLabelIds] = useState<Set<string>>(
    () => new Set(),
  );
  const hiddenLabelIdsRef = useRef<Set<string>>(new Set());
  const overlayHiddenLabelIdsRef = useRef<Set<string>>(new Set());
  useLayoutEffect(() => {
    if (layoutFrozen) return;

    if (labels.length === 0) {
      hiddenLabelIdsRef.current = new Set();
      overlayHiddenLabelIdsRef.current = new Set();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHiddenLabelIds(new Set());
      setOverlayHiddenLabelIds(new Set());
      return;
    }

    const measured: {
      buildingId: string;
      distSq: number;
      rect: ScreenRect;
      isPriority: boolean;
    }[] = [];
    for (const label of labels) {
      const el = labelElsRef.current.get(label.buildingId);
      if (!el || !label) continue;
      const dx = camera.position.x - label.worldX;
      const dy = camera.position.y - label.worldY;
      const dz = camera.position.z - label.worldZ;
      measured.push({
        buildingId: label.buildingId,
        distSq: dx * dx + dy * dy + dz * dz,
        rect: el.getBoundingClientRect(),
        isPriority: label.isPriority,
      });
    }

    measured.sort((a, b) => {
      const aExpanded = a.buildingId === expandedBuildingId;
      const bExpanded = b.buildingId === expandedBuildingId;
      if (aExpanded !== bExpanded) return aExpanded ? -1 : 1;
      if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
      return a.distSq - b.distSq;
    });

    const overlayRects = getVisibleMapOverlayRects();
    const accepted: ScreenRect[] = [];
    const hidden = new Set<string>();
    const overlayHidden = new Set<string>();
    for (const m of measured) {
      const outsideSafeViewport =
        m.rect.left < LABEL_OVERLAY_MARGIN ||
        m.rect.top < LABEL_OVERLAY_MARGIN ||
        m.rect.right > window.innerWidth - LABEL_OVERLAY_MARGIN ||
        m.rect.bottom > window.innerHeight - LABEL_OVERLAY_MARGIN;
      if (
        outsideSafeViewport ||
        overlayRects.some((overlayRect) =>
          rectsCollide(overlayRect, m.rect, LABEL_OVERLAY_MARGIN),
        )
      ) {
        overlayHidden.add(m.buildingId);
        continue;
      }

      if (
        accepted.some((other) =>
          rectsCollide(other, m.rect, LABEL_COLLISION_MARGIN),
        )
      ) {
        hidden.add(m.buildingId);
      } else {
        accepted.push(m.rect);
      }
    }

    const updateHiddenIds = (
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

    updateHiddenIds(hiddenLabelIdsRef.current, hidden, (next) => {
      hiddenLabelIdsRef.current = next;
      setHiddenLabelIds(next);
    });
    updateHiddenIds(
      overlayHiddenLabelIdsRef.current,
      overlayHidden,
      (next) => {
        overlayHiddenLabelIdsRef.current = next;
        setOverlayHiddenLabelIds(next);
      },
    );
  }, [
    labels,
    camera,
    labelLayoutRevision,
    expandedBuildingId,
    layoutFrozen,
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

  if (hidden) return null;

  return (
    <>
      {labels.map((label) => {
        const isSelected = selectedBuilding?.id === label.buildingId;
        const isActivelyExpanded = expandedBuildingId === label.buildingId;
        const isExpanded = isActivelyExpanded;
        // Todas las etiquetas muestran el nombre completo. La activa conserva
        // prioridad frente a otros rótulos, pero no puede atravesar una ventana
        // o control reservado del visor.
        const isCollisionHidden =
          layoutFrozen ||
          overlayHiddenLabelIds.has(label.buildingId) ||
          (!isExpanded && hiddenLabelIds.has(label.buildingId));

        // Código del edificio: cortar si es muy largo para que nunca rompa en la pill
        const displayCode = label.alias.length > 16
          ? label.alias.slice(0, 15) + "…"
          : label.alias;

        return (
          <Html
            key={label.buildingId}
            position={[label.x, label.y, label.z]}
            // Antes el seleccionado siempre iba a un z-index más alto ([6] vs
            // [5]) — eso, sumado a que casi siempre gana la prioridad por
            // cercanía tras el zoom de cámara al seleccionarlo, hacía que su
            // botón opaco quedara SIEMPRE encima de cualquier vecino
            // colisionado. Mismo z-index para todos: gana el que esté más
            // cerca de la cámara, sin sesgo por selección.
            zIndexRange={[5, 0]}
          >
            <div
              ref={(el) => {
                if (el) labelElsRef.current.set(label.buildingId, el);
                else labelElsRef.current.delete(label.buildingId);
              }}
              className={`ito-building-label has-name${isSelected ? " is-selected" : ""}${isExpanded ? " is-expanded" : ""}`}
              role="button"
              tabIndex={isCollisionHidden ? -1 : 0}
              aria-label={label.name}
              aria-expanded={isExpanded}
              onPointerEnter={(event) => {
                if (event.pointerType === "touch") return;
                openLabelPreview(label.buildingId);
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === "touch") return;
                scheduleLabelPreviewClose(label.buildingId);
              }}
              onPointerUp={(event) => {
                if (event.pointerType !== "touch") return;
                event.stopPropagation();
                const building = buildings.find((item) => item.id === label.buildingId);
                if (building) onSelectBuilding(building);
              }}
              // Sin esto, un clic de mouse que no muevas (no es "drag") sigue
              // el bubbling nativo del DOM hasta el contenedor del Canvas de
              // r3f — que le pertenece a un componente <Html> distinto (el de
              // esta etiqueta es un portal, pero su nodo real sigue anidado
              // ahí) — y su gestor de eventos dispara SU PROPIO raycast en
              // esas coordenadas de pantalla, seleccionando lo que sea que
              // esté ahí en el modelo 3D. En vista aérea, con los edificios
              // chiquitos y muy juntos, eso casi nunca es el edificio de la
              // etiqueta que en realidad tocaste — a veces ni siquiera hay
              // nada ahí. El touch ya lo evitaba (arriba); esto lo cierra
              // también para mouse/pointer fino.
              onClick={(event) => {
                event.stopPropagation();
                const building = buildings.find((item) => item.id === label.buildingId);
                if (building) onSelectBuilding(building);
              }}
              onFocus={() => openLabelPreview(label.buildingId)}
              onBlur={() => scheduleLabelPreviewClose(label.buildingId)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                const building = buildings.find((item) => item.id === label.buildingId);
                if (building) onSelectBuilding(building);
              }}
              style={{
                transform: "translateX(-50%) translateY(-100%)",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                position: "relative",
                // El nombre completo forma parte de cada rótulo; un ancho
                // estable permite medir colisiones sin saltos por hover.
                width: isMobile ? 164 : 188,
                maxWidth: "calc(100vw - 24px)",
                padding: "7px 11px",
                borderRadius: 10,
                border: `1.5px solid ${
                  isSelected ? label.accentColor : "rgba(148,163,184,0.32)"
                }`,
                background: isSelected
                  ? "rgba(255,255,255,0.97)"
                  : "rgba(255,255,255,0.92)",
                // Una superficie casi opaca ya da el contraste necesario. No
                // alternar backdrop-filter al cambiar de modo evita recrear
                // decenas de capas GPU encima del canvas durante la animación.
                backdropFilter: "none",
                WebkitBackdropFilter: "none",
                color: "#111827",
                cursor: "pointer",
                boxShadow: isSelected
                  ? `0 10px 28px ${label.accentColor}24, 0 0 0 3px ${label.accentColor}18`
                  : isAerial
                    ? "0 2px 7px rgba(15,23,42,0.14)"
                    : "0 8px 22px rgba(15,23,42,0.16)",
                fontFamily: "var(--font-body)",
                userSelect: "none",
                // `isCollisionHidden` usa opacity (no `visibility:hidden`/`display:none`) para
                // que la transición de aparición/desaparición sea suave en vez de un corte brusco.
                opacity: isCollisionHidden ? 0 : labelsFaded && !isSelected ? 0.38 : 1,
                // Solo las etiquetas que ganaron la colisión reciben eventos.
                // Así el nombre se revela sobre la misma pill sin reactivar
                // rótulos transparentes que están ocultos debajo de otros.
                // Una etiqueta expandida en móvil sigue visible pero deja
                // pasar el siguiente gesto al canvas. Así el rótulo grande del
                // edificio enfocado no bloquea el primer intento de rotación.
                pointerEvents:
                  isCollisionHidden || (isMobile && isExpanded)
                    ? "none"
                    : "auto",
                touchAction: "manipulation",
                outline: "none",
                transition:
                  "box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms cubic-bezier(0.16, 1, 0.3, 1)",
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
                  padding: "3px 7px",
                  borderRadius: 999,
                  background: `${label.accentColor}22`,
                  color: label.accentColor,
                }}
              >
                {displayCode}
              </span>

              {/* Nombre completo en la misma etiqueta: hover/foco en escritorio
                  y toque o selección sobre dispositivos táctiles. */}
              <span
                style={{
                  display: "block",
                  fontSize: isMobile ? 10 : 10.5,
                  fontWeight: 600,
                  lineHeight: 1.28,
                  textAlign: "center",
                  opacity: 0.92,
                  whiteSpace: "normal",
                  wordBreak: "normal",
                  overflowWrap: "anywhere",
                  width: "100%",
                }}
              >
                {label.name}
              </span>
              {isActivelyExpanded && label.departmentNames.length > 0 && (
                <span className="ito-building-label__departments">
                  {label.departmentNames.slice(0, 2).join(" · ")}
                </span>
              )}
            </div>
          </Html>
        );
      })}
    </>
  );
});

type BuildingInteractionTarget = {
  buildingId: string;
  center: [number, number, number];
  size: [number, number, number];
};

function BuildingInteractionLayer({
  buildings,
  active,
  hoverEnabled,
  touchTarget,
  onHoverBuilding,
  onSelectBuilding,
}: {
  buildings: Building[];
  active: boolean;
  hoverEnabled: boolean;
  touchTarget: boolean;
  onHoverBuilding: (hover: HoveredBuilding | null) => void;
  onSelectBuilding: (building: Building) => void;
}) {
  const { scene } = useCampusGltf();
  const { camera, gl } = useThree();
  const { handlePointerDown, wasDrag } = useSharedPointerDownTracker();
  const hoveredBuildingIdRef = useRef<string | null>(null);
  const pendingHoverRef = useRef<HoveredBuilding | null>(null);
  const hoverSwitchTimerRef = useRef<number | null>(null);
  const hoverClearTimerRef = useRef<number | null>(null);
  const projectedCenterRef = useRef(new Vector3());
  const nameToBuilding = useMemo(
    () => buildNameToBuildingMap(buildings),
    [buildings],
  );
  const buildingsById = useMemo(
    () => new Map(buildings.map((building) => [building.id, building])),
    [buildings],
  );

  const targets = useMemo<BuildingInteractionTarget[]>(() => {
    if (!active) return [];

    scene.updateMatrixWorld(true);
    const result: BuildingInteractionTarget[] = [];
    const nodeWinner = new Map<string, string>();
    const worldBox = new Box3();
    const worldCenter = new Vector3();
    const localCenter = new Vector3();
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
      localCenter.copy(worldCenter);
      scene.worldToLocal(localCenter);

      result.push({
        buildingId: building.id,
        center: [localCenter.x, localCenter.y, localCenter.z],
        size: [
          Math.max(worldSize.x + (touchTarget ? 5 : 1.5), touchTarget ? 10 : 4),
          Math.max(worldSize.y + 1, 4),
          Math.max(worldSize.z + (touchTarget ? 5 : 1.5), touchTarget ? 10 : 4),
        ],
      });
    }

    return result;
  }, [active, buildings, scene, touchTarget]);

  const resolveBuildingForEvent = useCallback(
    (event: ThreeEvent<MouseEvent | PointerEvent>): Building | null => {
      // La geometría real visible siempre tiene prioridad sobre las cajas de
      // ayuda. Esto evita que una caja ampliada de un edificio vecino robe el
      // clic aunque su cara frontal esté un poco más cerca de la cámara.
      const exactBuilding = findExactBuildingFromIntersections(
        event.intersections,
        nameToBuilding,
      );
      if (exactBuilding) return exactBuilding;

      // Si el toque cayó en el margen táctil y no en la geometría, elegir
      // la zona cuyo centro proyectado esté más cerca del dedo/puntero. La
      // distancia de intersección del rayo no sirve aquí: en cajas
      // superpuestas casi siempre favorece al volumen equivocado.
      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const pointerY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const seen = new Set<string>();
      let bestBuilding: Building | null = null;
      let bestDistanceSq = Number.POSITIVE_INFINITY;

      for (const intersection of event.intersections) {
        const buildingId = intersection.object.userData[
          BUILDING_HIT_TARGET_KEY
        ] as string | undefined;
        if (!buildingId || seen.has(buildingId)) continue;
        seen.add(buildingId);

        const building = buildingsById.get(buildingId);
        if (!building) continue;

        intersection.object.getWorldPosition(projectedCenterRef.current);
        projectedCenterRef.current.project(camera);
        const dx = projectedCenterRef.current.x - pointerX;
        const dy = projectedCenterRef.current.y - pointerY;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq < bestDistanceSq) {
          bestDistanceSq = distanceSq;
          bestBuilding = building;
        }
      }

      return bestBuilding;
    },
    [buildingsById, camera, gl, nameToBuilding],
  );

  const commitHover = useCallback(
    (hover: HoveredBuilding | null) => {
      const nextId = hover?.buildingId ?? null;
      if (hoveredBuildingIdRef.current === nextId) return;
      hoveredBuildingIdRef.current = nextId;
      onHoverBuilding(hover);
    },
    [onHoverBuilding],
  );

  const scheduleHoverClear = useCallback(
    (leavingBuildingId?: string) => {
      if (
        leavingBuildingId &&
        !shouldClearHoverOnPointerOut(
          leavingBuildingId,
          hoveredBuildingIdRef.current,
          pendingHoverRef.current?.buildingId ?? null,
        )
      ) {
        return;
      }

      if (hoverSwitchTimerRef.current !== null) {
        window.clearTimeout(hoverSwitchTimerRef.current);
        hoverSwitchTimerRef.current = null;
      }
      pendingHoverRef.current = null;

      if (hoverClearTimerRef.current !== null) {
        window.clearTimeout(hoverClearTimerRef.current);
      }
      // Tolera huecos de unos pocos píxeles entre cajas y el orden variable
      // pointerout/pointerover de Three.js sin dejar una etiqueta pegada.
      hoverClearTimerRef.current = window.setTimeout(() => {
        hoverClearTimerRef.current = null;
        commitHover(null);
      }, 150);
    },
    [commitHover],
  );

  const updateHover = useCallback(
    (building: Building) => {
      if (!active || !hoverEnabled) return;

      if (hoverClearTimerRef.current !== null) {
        window.clearTimeout(hoverClearTimerRef.current);
        hoverClearTimerRef.current = null;
      }

      const nextId = building.id;
      if (hoveredBuildingIdRef.current === nextId) {
        if (hoverSwitchTimerRef.current !== null) {
          window.clearTimeout(hoverSwitchTimerRef.current);
          hoverSwitchTimerRef.current = null;
        }
        pendingHoverRef.current = null;
        return;
      }
      if (pendingHoverRef.current?.buildingId === nextId) return;

      if (hoverSwitchTimerRef.current !== null) {
        window.clearTimeout(hoverSwitchTimerRef.current);
      }
      const pending = { buildingId: nextId };
      pendingHoverRef.current = pending;
      // La primera apertura responde rápido; cambiar entre vecinos exige que
      // el puntero permanezca brevemente sobre el nuevo edificio.
      const delay = hoveredBuildingIdRef.current === null ? 70 : 115;
      hoverSwitchTimerRef.current = window.setTimeout(() => {
        hoverSwitchTimerRef.current = null;
        if (pendingHoverRef.current?.buildingId !== nextId) return;
        pendingHoverRef.current = null;
        commitHover(pending);
      }, delay);
    },
    [active, commitHover, hoverEnabled],
  );

  useEffect(() => {
    if (active && hoverEnabled) return;

    if (hoverSwitchTimerRef.current !== null) {
      window.clearTimeout(hoverSwitchTimerRef.current);
      hoverSwitchTimerRef.current = null;
    }
    if (hoverClearTimerRef.current !== null) {
      window.clearTimeout(hoverClearTimerRef.current);
      hoverClearTimerRef.current = null;
    }
    pendingHoverRef.current = null;
    commitHover(null);
  }, [active, commitHover, hoverEnabled]);

  useEffect(() => {
    return () => {
      if (hoverSwitchTimerRef.current !== null) {
        window.clearTimeout(hoverSwitchTimerRef.current);
      }
      if (hoverClearTimerRef.current !== null) {
        window.clearTimeout(hoverClearTimerRef.current);
      }
    };
  }, []);

  if (!active) return null;

  return (
    <>
      {targets.map((target) => {
        return (
          <mesh
            key={target.buildingId}
            position={target.center}
            userData={{ [BUILDING_HIT_TARGET_KEY]: target.buildingId }}
            onPointerDown={handlePointerDown}
            onPointerOver={
              hoverEnabled
                ? (event) => {
                    const building = resolveBuildingForEvent(event);
                    if (building) updateHover(building);
                    else scheduleHoverClear();
                  }
                : undefined
            }
            onPointerMove={
              hoverEnabled
                ? (event) => {
                    const building = resolveBuildingForEvent(event);
                    if (building) updateHover(building);
                    else scheduleHoverClear();
                  }
                : undefined
            }
            onPointerOut={
              hoverEnabled
                ? (event) => {
                    const leavingBuildingId = event.object.userData[
                      BUILDING_HIT_TARGET_KEY
                    ] as string | undefined;
                    if (leavingBuildingId) {
                      scheduleHoverClear(leavingBuildingId);
                    }
                  }
                : undefined
            }
            onClick={(event) => {
              event.stopPropagation();
              if (wasDrag(event)) return;
              const building = resolveBuildingForEvent(event);
              if (building) onSelectBuilding(building);
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
  enableLocationCalibrationTools = false,
  hideCategoryLegend = false,
  mapXOffset = 0,
  gatePlacementPosition,
  onGatePlacementChange,
}: CampusViewerProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const cameraAnimRef = useRef<CameraAnim | null>(null);
  // Marca si el enfoque en curso arrancó desde vista aérea: en ese caso la
  // pose aérea (o la que haya quedado tras rotar/hacer pan libremente ahí)
  // NO debe reusarse como "dirección de acercamiento" — ver uso en el efecto
  // que consume `focus` más abajo.
  const focusFromAerialRef = useRef(false);
  const lastSelectedFocusRef = useRef<BuildingFocusSnapshot | null>(null);
  const lastSelectedGateRef = useRef<string | null>(null);
  const lastSelectedMapPointRef = useRef<string | null>(null);
  // Congela el offset al montar para no saltar la cámara si cambia el sidebar
  const initialXOffsetRef = useRef(mapXOffset);

  const legacyMapPosition = useLocationStore((state) => state.mapPosition);
  const deviceMapPosition = useDeviceLocationStore(
    (state) => state.campusPosition,
  );
  const mapPosition = LOCATION_FEATURE_FLAGS.enableDeviceLocationV2
    ? deviceMapPosition
    : legacyMapPosition;

  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const selectedGate = useBuildingStore((state) => state.selectedGate);
  const selectedMapPoint = useBuildingStore((state) => state.selectedMapPoint);
  const selectedSearchResult = useBuildingStore((state) => state.selectedSearchResult);
  const clearSelection = useBuildingStore((state) => state.clearSelection);
  const glbPositions = useBuildingGlbStore((s) => s.positions);
  const inputProfile = useInputProfile();
  const touchOptimized = inputProfile.hasTouch;
  const maxCameraDistance = isMobile
    ? MOBILE_MAX_CAMERA_DISTANCE
    : DESKTOP_MAX_CAMERA_DISTANCE;
  const gatePlacementActive = Boolean(onGatePlacementChange);

  const adminUser = useAdminAuthStore((state) => state.user);
  const isAdminAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const canUseAdvancedTools =
    isAdminAuthenticated &&
    (adminUser?.role === "superadmin" ||
      (enableAdminTools && adminUser?.role === "admin"));
  const showLocationCalibrationTools =
    canUseAdvancedTools && enableLocationCalibrationTools;

  // La guía se abre bajo demanda desde el botón de ayuda. Evitar que aparezca
  // automáticamente mantiene un único flujo activo, especialmente al rotar
  // un teléfono o abrir otra ventana móvil.
  const mapTutorial = useMapTutorial(false);

  const [buildingsVersion, setBuildingsVersion] = useState(0);
  const { buildings } = useBuildings({ admin: canUseAdvancedTools, version: buildingsVersion });
  const [focus, setFocus] = useState<FocusPoint | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("immersive");
  const [cameraMoving, setCameraMoving] = useState(false);
  const cameraMovingRef = useRef(false);
  const cameraAnimatingRef = useRef(false);
  const cameraSettleTimerRef = useRef<number | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<HoveredBuilding | null>(null);
  const [campusPosition, setCampusPosition] = useState(() =>
    DEFAULT_CAMPUS_POSITION.clone()
  );
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [isLoadingExiting, setIsLoadingExiting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [streets, setStreets] = useState<CampusStreet[]>([]);
  const [showBuildingLabels, setShowBuildingLabels] = useState(true);
  const [showStreetLabels, setShowStreetLabels] = useState(true);
  const [compassRotation, setCompassRotation] = useState(0);
  const [streetCameraPosition, setStreetCameraPosition] = useState<{ x: number; z: number } | null>(null);
  // Mantener el DPR estable entre modos evita que WebGL redimensione y limpie
  // el framebuffer justo al comenzar la animación aérea (el destello blanco
  // que también hacía parecer que las etiquetas parpadeaban).
  const canvasDpr = useMemo<[number, number]>(
    () => [1, isMobile ? 1.15 : 1.5],
    [isMobile],
  );
  const handleModelLoaded = useCallback(() => setIsModelLoaded(true), []);
  const handleCampusPositionChange = useCallback((nextPosition: Vector3) => {
    setCampusPosition((current) =>
      current.distanceToSquared(nextPosition) < 0.0001
        ? current
        : nextPosition.clone()
    );
  }, []);
  const handleCompassRotation = useCallback((degrees: number) => {
    setCompassRotation(degrees);
  }, []);
  const handleStreetCameraPosition = useCallback(
    (position: { x: number; z: number }) => setStreetCameraPosition(position),
    []
  );

  useEffect(() => {
    let active = true;
    Promise.all([getDepartmentsApi(), getCampusStreetsApi()])
      .then(([departmentRows, streetRows]) => {
        if (!active) return;
        setDepartments(departmentRows);
        setStreets(streetRows);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  const { progress: loadProgress } = useProgress();
  const [calibrationOpen, setCalibrationOpen] = useState(false);

  const markCameraMoving = useCallback(() => {
    if (!cameraMovingRef.current) {
      cameraMovingRef.current = true;
      setCameraMoving(true);
    }
  }, []);

  const scheduleCameraSettled = useCallback(() => {
    if (cameraSettleTimerRef.current !== null) {
      window.clearTimeout(cameraSettleTimerRef.current);
    }
    cameraSettleTimerRef.current = window.setTimeout(() => {
      cameraSettleTimerRef.current = null;
      if (cameraAnimatingRef.current) return;
      cameraMovingRef.current = false;
      setCameraMoving(false);
    }, 180);
  }, []);

  const handleCameraMotion = useCallback(() => {
    markCameraMoving();
    // CameraAnimator informa explícitamente cuándo termina. No crear un timer
    // por frame: en móviles lentos podía vencer entre dos frames, descongelar
    // colisiones y volverlas a congelar, generando parpadeo de etiquetas.
    if (cameraAnimatingRef.current) return;
    scheduleCameraSettled();
  }, [markCameraMoving, scheduleCameraSettled]);

  const handleCameraAnimatingChange = useCallback(
    (isAnimating: boolean) => {
      cameraAnimatingRef.current = isAnimating;
      if (isAnimating) {
        if (cameraSettleTimerRef.current !== null) {
          window.clearTimeout(cameraSettleTimerRef.current);
          cameraSettleTimerRef.current = null;
        }
        markCameraMoving();
        return;
      }
      scheduleCameraSettled();
    },
    [markCameraMoving, scheduleCameraSettled],
  );

  const cancelCameraAnimation = useCallback(() => {
    if (!cameraAnimRef.current && !cameraAnimatingRef.current) return;
    cameraAnimRef.current = null;
    cameraAnimatingRef.current = false;
    if (controlsRef.current) controlsRef.current.enabled = true;
    if (cameraSettleTimerRef.current !== null) {
      window.clearTimeout(cameraSettleTimerRef.current);
      cameraSettleTimerRef.current = null;
    }
    cameraMovingRef.current = false;
    setCameraMoving(false);
  }, []);

  useEffect(() => {
    return () => {
      if (cameraSettleTimerRef.current !== null) {
        window.clearTimeout(cameraSettleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!LOCATION_FEATURE_FLAGS.enableLegacyLocation) return;

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
    if (!LOCATION_FEATURE_FLAGS.enableLegacyLocation) return;

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
    // Si veníamos de vista aérea, ignorar la pose actual de controls: su
    // dirección (la del sobrevuelo, o la que el usuario haya rotado ahí
    // libremente) no tiene relación con un buen ángulo de acercamiento a
    // nivel de calle. getPointFocusPose cae a su dirección por defecto
    // cuando controls es null/undefined — mismo mecanismo que ya usaba para
    // el primer enfoque de la sesión, solo que ahora se activa a propósito.
    const poseSource = focusFromAerialRef.current ? null : controlsRef.current;
    const target = getBuildingFocusPose(focus, isMobile, poseSource);
    cameraAnimRef.current = {
      pos: target.pos,
      look: target.look,
      duration: getCameraMoveDuration(
        controlsRef.current?.object?.position,
        target.pos,
      ),
    };
  }, [focus, isMobile]);

  const handleSelectBuilding = useCallback(
    (building: Building) => {
      // El callback se ejecuta incluso si el usuario toca nuevamente el mismo
      // edificio ya seleccionado. Zustand evita una actualización duplicada,
      // pero el reenfoque de cámara sí debe ocurrir, sobre todo desde aérea.
      useBuildingStore.getState().setSelectedBuilding(building);

      const latestGlbPosition =
        useBuildingGlbStore.getState().positions[building.id];
      const x = Number(latestGlbPosition?.x ?? building.x);
      const z = Number(latestGlbPosition?.z ?? building.z);
      if (!Number.isFinite(x) || !Number.isFinite(z)) return;

      cancelCameraAnimation();
      lastSelectedFocusRef.current = {
        buildingId: building.id,
        x,
        z,
        campusX: campusPosition.x,
        campusZ: campusPosition.z,
      };
      focusFromAerialRef.current = viewMode === "aerial";
      setViewMode("immersive");
      setFocus(createFocusPoint(x, z, campusPosition));
    },
    [campusPosition, cancelCameraAnimation, viewMode],
  );

  const selectedGlbPosition = selectedBuilding
    ? glbPositions[selectedBuilding.id]
    : undefined;

  useEffect(() => {
    if (!selectedBuilding) {
      lastSelectedFocusRef.current = null;
      return;
    }
    const x = Number(selectedGlbPosition?.x ?? selectedBuilding.x);
    const z = Number(selectedGlbPosition?.z ?? selectedBuilding.z);
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    const nextFocus: BuildingFocusSnapshot = {
      buildingId: selectedBuilding.id,
      x,
      z,
      campusX: campusPosition.x,
      campusZ: campusPosition.z,
    };
    if (isSameBuildingFocus(lastSelectedFocusRef.current, nextFocus)) return;
    lastSelectedFocusRef.current = nextFocus;
    // Enfocar un edificio siempre implica vista inmersiva: si el usuario
    // estaba en modo aéreo, el acercamiento no debe quedar "a medias"
    // con la cámara aún lejos por culpa del modo previo.
    focusFromAerialRef.current = viewMode === "aerial";
    setViewMode("immersive");
    setFocus(createFocusPoint(x, z, campusPosition));
  // Usar solo las coordenadas del edificio seleccionado evita reaccionar a
  // cambios de otros nodos, pero permite corregir el foco provisional cuando
  // llega la posición GLB exacta o termina el autocentrado del campus.
  // viewMode se captura únicamente al iniciar este enfoque. Incluirlo haría
  // que el botón de vista aérea volviera de inmediato al modo inmersivo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBuilding, selectedGlbPosition?.x, selectedGlbPosition?.z, campusPosition]);

  useEffect(() => {
    if (!selectedGate) {
      lastSelectedGateRef.current = null;
      return;
    }
    if (lastSelectedGateRef.current === selectedGate.id) return;
    lastSelectedGateRef.current = selectedGate.id;
    focusFromAerialRef.current = viewMode === "aerial";
    setViewMode("immersive");
    setFocus(createFocusPoint(selectedGate.x, selectedGate.z, campusPosition));
  // viewMode se lee intencionalmente sin listarlo: solo importa su valor en
  // el instante de la selección, no debe re-disparar este efecto por sí solo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGate, campusPosition]);

  useEffect(() => {
    if (!selectedMapPoint) {
      lastSelectedMapPointRef.current = null;
      return;
    }
    if (lastSelectedMapPointRef.current === selectedMapPoint.id) return;
    lastSelectedMapPointRef.current = selectedMapPoint.id;
    focusFromAerialRef.current = viewMode === "aerial";
    setViewMode("immersive");
    setFocus(createFocusPoint(selectedMapPoint.x, selectedMapPoint.z, campusPosition));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMapPoint, campusPosition]);

  // El modelo puede mostrarse aunque el catálogo de edificios esté vacío o
  // la API no responda. Vincular el overlay a `buildings.length` dejaba la
  // pantalla de carga abierta para siempre ante cualquier fallo del backend.
  const isContentReady = isModelLoaded;
  useEffect(() => {
    if (!isContentReady) return;
    const t1 = setTimeout(() => setIsLoadingExiting(true), 50);
    const t2 = setTimeout(() => setShowLoading(false), 430);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isContentReady]);

  const handleFocusUser = () => {
    if (!mapPosition) return;
    lastSelectedFocusRef.current = null;
    focusFromAerialRef.current = viewMode === "aerial";
    setViewMode("immersive");
    setFocus(createFocusPoint(mapPosition.x, mapPosition.z, campusPosition));
  };

  const handleResetView = () => {
    const xOff = getModeXOffset(viewMode, isMobile, initialXOffsetRef.current);
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
    const xOff = getModeXOffset(nextMode, isMobile, initialXOffsetRef.current);
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

  const handleZoom = useCallback((delta: number) => {
    if (!controlsRef.current) return;
    cancelCameraAnimation();
    const controls = controlsRef.current;
    controls.enabled = true;
    const offset = controls.object.position.clone().sub(controls.target);
    if (offset.lengthSq() < 0.0001) offset.set(0, 0, 1);
    const nextDistance = getClampedZoomDistance(
      offset.length(),
      delta,
      controls.minDistance ?? (isMobile
        ? MOBILE_MIN_CAMERA_DISTANCE
        : DESKTOP_MIN_CAMERA_DISTANCE),
      controls.maxDistance ?? maxCameraDistance,
    );
    offset.setLength(nextDistance);
    controls.object.position.copy(controls.target).add(offset);
    controls.update();
    handleCameraMotion();
  }, [cancelCameraAnimation, handleCameraMotion, isMobile, maxCameraDistance]);

  useEffect(() => {
    if (!inputProfile.hasKeyboard || mobilePanelOpen) return;

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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const hasLocation = mapPosition !== null;
  const canShowHoverDetails =
    !isMobile && inputProfile.hasFinePointer && inputProfile.hasHover;
  const buildingSelectionActive = !gatePlacementActive && !mobilePanelOpen;

  useEffect(() => {
    if (canShowHoverDetails && buildingSelectionActive) return;
    setHoveredBuilding(null);
  }, [buildingSelectionActive, canShowHoverDetails]);

  return (
    <div
      onPointerDownCapture={() => {
        // El gesto puede comenzar sobre el canvas, una etiqueta HTML o una
        // capa de Drei. Cancelarlo desde la raíz garantiza que todos esos
        // caminos detengan el enfoque y reactiven OrbitControls de inmediato.
        cancelCameraAnimation();
      }}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        cursor: viewMode === "aerial" ? "pointer" : undefined,
      }}
    >
      {LOCATION_FEATURE_FLAGS.enableLegacyLocation && (
        <LocationSync buildings={buildings} />
      )}

      {(LOCATION_FEATURE_FLAGS.enableDebugPanel ||
        showLocationCalibrationTools) && (
        <LocationDebugPanel defaultCollapsed={isMobile} />
      )}

      {!mobilePanelOpen && (
        <>
          <CompassIndicator rotationDegrees={compassRotation} isMobile={isMobile} />
          {!(isMobile && selectedSearchResult) && (
            <MapLayerControls
              showBuildingLabels={showBuildingLabels}
              showStreetLabels={showStreetLabels}
              onToggleBuildingLabels={() => setShowBuildingLabels((value) => !value)}
              onToggleStreetLabels={() => setShowStreetLabels((value) => !value)}
              isMobile={isMobile}
            />
          )}
        </>
      )}

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
            border: "1px solid #c15a3e",
            background: "rgba(15,23,42,0.92)",
            color: "#c56b52",
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
          calibrationOpen={calibrationOpen}
          onFocusUser={handleFocusUser}
          onResetView={handleResetView}
          onZoom={handleZoom}
          viewMode={viewMode}
          onToggleViewMode={handleToggleViewMode}
          onToggleCalibration={() => setCalibrationOpen((current) => !current)}
          onOpenTutorial={mapTutorial.reopen}
          canUseAdvancedTools={
            canUseAdvancedTools && LOCATION_FEATURE_FLAGS.enableLegacyLocation
          }
          isMobile={isMobile}
        />
      )}

      {canUseAdvancedTools &&
        LOCATION_FEATURE_FLAGS.enableLegacyLocation &&
        calibrationOpen && (
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

      <Canvas
        frameloop="demand"
        dpr={canvasDpr}
        style={{ touchAction: "none" }}
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
          // En aérea, edificios y caminos ocupan pocos píxeles. MSAA evita el
          // shimmering que en móviles se percibía como parpadeo del modelo.
          antialias: true,
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
          onStart={cancelCameraAnimation}
          onChange={handleCameraMotion}
          onEnd={scheduleCameraSettled}
          minPolarAngle={Math.PI / 14}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={isMobile
            ? MOBILE_MIN_CAMERA_DISTANCE
            : DESKTOP_MIN_CAMERA_DISTANCE}
          maxDistance={maxCameraDistance}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={touchOptimized ? 0.58 : 0.75}
          zoomSpeed={touchOptimized ? 0.95 : 1}
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
        <CameraAnimator
          animRef={cameraAnimRef}
          controlsRef={controlsRef}
          onAnimatingChange={handleCameraAnimatingChange}
        />
        <CompassCameraSync onRotationChange={handleCompassRotation} />
        <StreetLabelCameraSync onPositionChange={handleStreetCameraPosition} />
        <CameraConstraints controlsRef={controlsRef} />
        <AerialTeleportLayer
          active={viewMode === "aerial"}
          onTeleport={handleAerialTeleport}
        />
        <Suspense fallback={null}>
          <CampusBoundsSync
            onPositionChange={handleCampusPositionChange}
            controlsRef={controlsRef}
            isMobile={isMobile}
            mapXOffset={initialXOffsetRef.current}
          />
          <group
            rotation={[0, CAMPUS_ROTATION_Y, 0]}
            position={campusPosition}
          >
            <CampusModel
              buildings={buildings}
              selectionDisabled={!buildingSelectionActive}
              onSelectBuilding={handleSelectBuilding}
            />
            <BuildingInteractionLayer
              buildings={buildings}
              active={buildingSelectionActive}
              hoverEnabled={canShowHoverDetails}
              touchTarget={inputProfile.hasTouch}
              onHoverBuilding={setHoveredBuilding}
              onSelectBuilding={handleSelectBuilding}
            />
            <ModelLoadedSignal onLoaded={handleModelLoaded} />
            <BuildingLabels
              buildings={buildings}
              departments={departments}
              isMobile={isMobile}
              hidden={mobilePanelOpen || !showBuildingLabels}
              isAerial={viewMode === "aerial"}
              layoutFrozen={cameraMoving}
              hoveredBuildingId={hoveredBuilding?.buildingId ?? null}
              onSelectBuilding={handleSelectBuilding}
            />
            <CampusStreetLabels
              streets={streets}
              isMobile={isMobile}
              hidden={mobilePanelOpen || !showStreetLabels}
              cameraPosition={streetCameraPosition ?? undefined}
            />
            <DestinationBuildingHighlight />
            {!gatePlacementActive && <GateMarkers />}
            {gatePlacementActive && onGatePlacementChange && (
              <GatePlacementLayer
                position={gatePlacementPosition ?? null}
                onPositionChange={onGatePlacementChange}
              />
            )}
            {LOCATION_FEATURE_FLAGS.enableLegacyLocation && (
              <UserLocationMarker />
            )}
            {LOCATION_FEATURE_FLAGS.enableDeviceLocationV2 && (
              <DeviceLocationLayer />
            )}
          </group>
        </Suspense>
      </Canvas>

      <AnimatePresence>
        {mapTutorial.isOpen && (
          <MapTutorialOverlay inputProfile={inputProfile} onClose={mapTutorial.close} />
        )}
      </AnimatePresence>
    </div>
  );
}

// La precarga (solo aplica a la variante web/WebP) vive en useCampusGltf.ts,
// disparada al importar ese módulo — no puede hacerse aquí a nivel de
// módulo para la variante nativa (KTX2) porque necesita un WebGLRenderer
// real, que todavía no existe antes de montar el <Canvas>.
