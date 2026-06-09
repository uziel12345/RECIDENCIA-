import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import {
  AdditiveBlending,
  Vector3,
  type BufferGeometry,
  type LineBasicMaterial,
  type LineSegments,
  type Mesh,
  type MeshBasicMaterial,
  type PointLight,
  type RingGeometry,
} from "three";
import type { Building } from "../../features/buildings/types/building";
import { useLocationStore } from "../../store/location-store";
import { useBuildingStore } from "../../store/building-store";
import { useAdminAuthStore } from "../../store/admin-auth-store";
import { getAdminBuildings, getBuildings } from "../../services/buildings.service";
import {
  startUserLocationTracking,
  stopUserLocationTracking,
} from "../../features/location/services/geolocation";
import { RouteLine } from "../../features/buildings/components/RouteLine";
import { Icon, type IconName } from "../ui/Icons";
import { getCategoryAccent } from "../ui/categoryAccent";
import {
  NavigationDraftEditorLayer,
  useDraftEditor,
} from "./NavigationDraftEditorLayer";
import { NavigationEditorModal } from "./NavigationEditorModal";
import { NavigationDebugLayer } from "./NavigationDebugLayer";
import { DestinationBuildingHighlight } from "./DestinationBuildingHighlight";

const MODEL_PATH = "/models/campus.glb";

const CAMPUS_ROTATION_Y = Math.PI / 2;
const CAMPUS_POSITION_X = 0;
const CAMPUS_POSITION_Z = 0;

type FocusPoint = {
  x: number;
  z: number;
};

type CampusViewerProps = {
  isMobile?: boolean;
  mobilePanelOpen?: boolean;
  enableAdminTools?: boolean;
  hideCategoryLegend?: boolean;
};

type NavigationDebugMode = "hidden" | "all" | "issues";
type WeatherMode = "clear" | "cloudy" | "rain" | "storm" | "fog";

type OpenMeteoCurrentWeather = {
  current?: {
    weather_code?: number;
    precipitation?: number;
    rain?: number;
    showers?: number;
    cloud_cover?: number;
  };
};

type WeatherPreset = {
  label: string;
  shortLabel: string;
  icon: string;
  sky: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  ambient: number;
  hemisphere: number;
  directional: number;
  gridPrimary: string;
  gridSecondary: string;
};

const WEATHER_PRESETS: Record<WeatherMode, WeatherPreset> = {
  clear: {
    label: "Soleado",
    shortLabel: "Sol",
    icon: "Sol",
    sky: "#eaf6ff",
    fog: "#eaf6ff",
    fogNear: 320,
    fogFar: 620,
    ambient: 1.28,
    hemisphere: 0.68,
    directional: 1.75,
    gridPrimary: "#cbd5e1",
    gridSecondary: "#e2e8f0",
  },
  cloudy: {
    label: "Nublado",
    shortLabel: "Nubes",
    icon: "Nub",
    sky: "#dfe8f2",
    fog: "#d8e2ec",
    fogNear: 240,
    fogFar: 520,
    ambient: 1.05,
    hemisphere: 0.55,
    directional: 1.2,
    gridPrimary: "#b8c4d1",
    gridSecondary: "#d4dde7",
  },
  rain: {
    label: "Lluvia",
    shortLabel: "Lluvia",
    icon: "Llu",
    sky: "#cdd8e5",
    fog: "#c4cfdd",
    fogNear: 190,
    fogFar: 440,
    ambient: 0.9,
    hemisphere: 0.5,
    directional: 0.95,
    gridPrimary: "#a9b7c7",
    gridSecondary: "#c6d0dc",
  },
  storm: {
    label: "Tormenta",
    shortLabel: "Tormenta",
    icon: "Tor",
    sky: "#aeb9c8",
    fog: "#aab5c4",
    fogNear: 150,
    fogFar: 390,
    ambient: 0.72,
    hemisphere: 0.42,
    directional: 0.72,
    gridPrimary: "#94a3b8",
    gridSecondary: "#b6c1cf",
  },
  fog: {
    label: "Niebla",
    shortLabel: "Niebla",
    icon: "Nie",
    sky: "#edf2f7",
    fog: "#e5ebf1",
    fogNear: 80,
    fogFar: 310,
    ambient: 1.08,
    hemisphere: 0.62,
    directional: 0.88,
    gridPrimary: "#c8d1dc",
    gridSecondary: "#dce3eb",
  },
};

const OAXACA_WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=17.0732&longitude=-96.7266&current=weather_code,precipitation,rain,showers,cloud_cover&timezone=America%2FMexico_City";

function weatherCodeToMode(current: OpenMeteoCurrentWeather["current"]): WeatherMode {
  const code = current?.weather_code ?? 0;
  const precipitation =
    (current?.precipitation ?? 0) + (current?.rain ?? 0) + (current?.showers ?? 0);
  const cloudCover = current?.cloud_cover ?? 0;

  if ([95, 96, 99].includes(code)) return "storm";
  if (code === 45 || code === 48) return "fog";
  if (
    precipitation > 0 ||
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82)
  ) {
    return "rain";
  }
  if (code >= 71 && code <= 77) return "fog";
  if (code === 2 || code === 3 || cloudCover >= 58) return "cloudy";

  return "clear";
}

function campusLocalToWorld(x: number, z: number) {
  const cos = Math.cos(CAMPUS_ROTATION_Y);
  const sin = Math.sin(CAMPUS_ROTATION_Y);

  return {
    x: x * cos + z * sin + CAMPUS_POSITION_X,
    z: -x * sin + z * cos + CAMPUS_POSITION_Z,
  };
}

function UserLocationMarker() {
  const mapPosition = useLocationStore((state) => state.mapPosition);
  const isLowAccuracy = useLocationStore((state) => state.isLowAccuracy);
  const ringRef = useRef<Mesh<RingGeometry, MeshBasicMaterial>>(null);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    elapsedRef.current += delta;

    const t = (elapsedRef.current % 1.6) / 1.6;
    const scale = 1 + t * 1.4;

    ringRef.current.scale.set(scale, scale, scale);
    ringRef.current.material.opacity = (1 - t) * (isLowAccuracy ? 0.22 : 0.55);
  });

  if (!mapPosition) return null;

  const markerColor = isLowAccuracy ? "#94a3b8" : "#2563eb";
  const markerEmissive = isLowAccuracy ? "#64748b" : "#1d4ed8";

  return (
    <group position={[mapPosition.x, 4, mapPosition.z]}>
      {isLowAccuracy && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <circleGeometry args={[18, 64]} />
          <meshBasicMaterial color="#94a3b8" transparent opacity={0.12} />
        </mesh>
      )}

      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.1, 0]}
      >
        <ringGeometry args={[5.5, 7, 48]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.55} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <circleGeometry args={[5, 48]} />
        <meshBasicMaterial
          color={markerColor}
          transparent
          opacity={isLowAccuracy ? 0.1 : 0.18}
        />
      </mesh>

      <mesh position={[0, 8, 0]}>
        <sphereGeometry args={[2.6, 32, 32]} />
        <meshStandardMaterial
          color={markerColor}
          emissive={markerEmissive}
          emissiveIntensity={isLowAccuracy ? 0.18 : 0.35}
        />
      </mesh>

      <mesh position={[0, 8, 0]}>
        <sphereGeometry args={[1.1, 24, 24]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {isLowAccuracy && (
        <Html position={[0, 13, 0]} center>
          <div
            style={{
              padding: "5px 9px",
              borderRadius: 999,
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #cbd5e1",
              color: "#475569",
              fontSize: 11,
              fontWeight: 800,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 10px rgba(15, 23, 42, 0.16)",
            }}
          >
            UbicaciÃ³n aproximada
          </div>
        </Html>
      )}
    </group>
  );
}

type BuildingLabelsProps = {
  buildings: Building[];
  isMobile?: boolean;
};

function getBuildingMarkerIcon(building: Building): IconName {
  const category = building.category_code?.toLowerCase?.() ?? "";

  switch (category) {
    case "biblioteca":
      return "map";

    case "aulas":
      return "graduation";

    case "laboratorio":
      return "layers";

    case "administrativo":
      return "building";

    case "servicio":
      return "flag";

    default:
      return "map-pin";
  }
}

function BuildingLabels({ buildings, isMobile = false }: BuildingLabelsProps) {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );

  const labelMaxWidth = isMobile ? 120 : 180;
  const compactFontSize = isMobile ? 10 : 12;
  const compactPadding = isMobile ? "3px 7px" : "6px 12px 6px 8px";
  const expandedPadding = isMobile ? "5px 10px 5px 5px" : "6px 12px 6px 8px";
  const labelGap = isMobile ? 5 : 8;
  const iconSize = isMobile ? 14 : 20;

  return (
    <>
      {buildings.map((building) => {
        if (building.x == null || building.z == null) {
          return null;
        }

        const y = (building.y ?? 0) + 12;
        const isSelected = selectedBuilding?.id === building.id;
        const accent = getCategoryAccent(building.category_name);
        const accentColor = building.category_color || accent.fg;
        const showFullName = !isMobile || isSelected;
        const padding = showFullName ? expandedPadding : compactPadding;

        return (
          <Html
            key={building.id}
            position={[building.x, y, building.z]}
            center
            zIndexRange={[isSelected ? 110 : 100, 0]}
            occlude={false}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedBuilding(building);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: showFullName ? labelGap : 4,
                padding,
                borderRadius: 999,
                border: `1px solid ${
                  isSelected ? accentColor : "rgba(15,23,42,0.12)"
                }`,
                background: isSelected
                  ? accentColor
                  : "rgba(255,255,255,0.97)",
                color: isSelected ? "#ffffff" : "#0f172a",
                fontSize: showFullName
                  ? isMobile
                    ? 11
                    : 12
                  : compactFontSize,
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                cursor: "pointer",
                boxShadow: isSelected
                  ? "0 8px 18px rgba(15,23,42,0.25)"
                  : "0 4px 10px rgba(15,23,42,0.18)",
                fontFamily: "Inter, sans-serif",
                letterSpacing: "0.01em",
                userSelect: "none",
                transform: "translateZ(0)",
                pointerEvents: "auto",
                touchAction: "manipulation",
                transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {showFullName ? (
                <>
                  <span
                    aria-hidden="true"
                    style={{
                      width: iconSize,
                      height: iconSize,
                      borderRadius: 999,
                      background: isSelected ? "#ffffff" : accentColor,
                      color: isSelected ? accentColor : "#ffffff",
                      display: "inline-grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      name={getBuildingMarkerIcon(building)}
                      size={isMobile ? 11 : 12}
                    />
                  </span>

                  <span
                    style={{
                      maxWidth: labelMaxWidth,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {building.name}
                  </span>
                </>
              ) : (
                <>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: accentColor,
                      flexShrink: 0,
                    }}
                  />
                  <span>{building.code}</span>
                </>
              )}
            </button>
          </Html>
        );
      })}
    </>
  );
}

function CampusModel() {
  const { scene } = useGLTF(MODEL_PATH);

  useMemo(() => {
    scene.traverse((child) => {
      if (child.name.startsWith("NavMesh")) child.visible = false;
    });
  }, [scene]);

  return <primitive object={scene} />;
}

function WeatherParticles({ mode, isMobile = false }: { mode: WeatherMode; isMobile?: boolean }) {
  const rainRef = useRef<LineSegments<BufferGeometry, LineBasicMaterial>>(null);
  const isRain = mode === "rain" || mode === "storm";
  const count = isMobile ? 320 : 560;
  const range = isMobile ? 360 : 520;
  const height = 145;
  const streakLength = mode === "storm" ? 18 : 12;

  const positions = useMemo(() => {
    const values = new Float32Array(count * 2 * 3);

    for (let i = 0; i < count; i += 1) {
      const base = i * 6;
      const x = (Math.random() - 0.5) * range;
      const y = Math.random() * height + 18;
      const z = (Math.random() - 0.5) * range;
      const slant = mode === "storm" ? 4.5 : 2.2;

      values[base] = x;
      values[base + 1] = y;
      values[base + 2] = z;
      values[base + 3] = x + slant;
      values[base + 4] = y - streakLength;
      values[base + 5] = z - slant * 0.5;
    }

    return values;
  }, [count, height, mode, range, streakLength]);

  useFrame((_, delta) => {
    const rain = rainRef.current;
    if (!rain) return;

    const attr = rain.geometry.attributes.position;
    const values = attr.array as Float32Array;
    const speed = mode === "storm" ? 118 : 82;
    const drift = mode === "storm" ? 24 : 10;

    for (let i = 0; i < count; i += 1) {
      const base = i * 6;

      values[base] += drift * delta;
      values[base + 1] -= speed * delta;
      values[base + 2] -= drift * 0.25 * delta;
      values[base + 3] += drift * delta;
      values[base + 4] -= speed * delta;
      values[base + 5] -= drift * 0.25 * delta;

      if (values[base + 1] < 2) {
        const x = (Math.random() - 0.5) * range;
        const y = height + 18;
        const z = (Math.random() - 0.5) * range;
        const slant = mode === "storm" ? 4.5 : 2.2;

        values[base] = x;
        values[base + 1] = y;
        values[base + 2] = z;
        values[base + 3] = x + slant;
        values[base + 4] = y - streakLength;
        values[base + 5] = z - slant * 0.5;
      }
    }

    attr.needsUpdate = true;
  });

  if (!isRain) return null;

  return (
    <lineSegments ref={rainRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color="#dbeafe"
        transparent
        opacity={mode === "storm" ? 0.52 : 0.42}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </lineSegments>
  );
}

function StormFlash({ active }: { active: boolean }) {
  const lightRef = useRef<PointLight>(null);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    if (!lightRef.current) return;
    elapsedRef.current += delta;

    if (!active) {
      lightRef.current.intensity = 0;
      return;
    }

    const cycle = elapsedRef.current % 5.5;
    lightRef.current.intensity =
      cycle > 0.18 && cycle < 0.32 ? 4.2 : cycle > 0.36 && cycle < 0.44 ? 2.6 : 0;
  });

  return <pointLight ref={lightRef} position={[0, 170, 40]} color="#dbeafe" distance={520} intensity={0} />;
}

function WeatherAtmosphere({ mode }: { mode: WeatherMode }) {
  return (
    <div className={`ito-weather-atmosphere ito-weather-atmosphere--${mode}`} aria-hidden="true">
      <div className="ito-weather-atmosphere__clouds" />
      <div className="ito-weather-atmosphere__rain" />
      <div className="ito-weather-atmosphere__mist" />
      <div className="ito-weather-atmosphere__flash" />
    </div>
  );
}

type ViewerToolbarProps = {
  hasLocation: boolean;
  navigationDebugMode: NavigationDebugMode;
  draftEditorActive: boolean;
  onFocusUser: () => void;
  onResetView: () => void;
  onZoom: (delta: number) => void;
  onToggleNavigationDebug: () => void;
  onToggleDraftEditor: () => void;
  canUseAdvancedTools?: boolean;
  isMobile?: boolean;
};

function ViewerToolbar({
  hasLocation,
  navigationDebugMode,
  draftEditorActive,
  onFocusUser,
  onResetView,
  onZoom,
  onToggleNavigationDebug,
  onToggleDraftEditor,
  canUseAdvancedTools = false,
  isMobile = false,
}: ViewerToolbarProps) {
  const showNavigationDebug = navigationDebugMode !== "hidden";
  const debugTitle =
    navigationDebugMode === "hidden"
      ? "Depurar rutas"
      : navigationDebugMode === "all"
        ? "Ver solo problemas"
        : "Ocultar depuraciÃ³n";

  return (
    <div
      className={`ito-toolbar ${isMobile ? "ito-toolbar--mobile" : ""}`}
      role="toolbar"
      aria-label="Controles del mapa"
    >
      <button
        type="button"
        className={`ito-toolbar__btn ${
          hasLocation ? "ito-toolbar__btn--accent" : ""
        }`}
        onClick={onFocusUser}
        aria-label="Centrar en mi ubicaciÃ³n"
        title={hasLocation ? "Centrar en mi ubicaciÃ³n" : "Esperando ubicaciÃ³nâ€¦"}
        disabled={!hasLocation}
      >
        <Icon name="crosshair" size={18} />
      </button>

      <div className="ito-toolbar__group" role="group" aria-label="Zoom">
        <button
          type="button"
          className="ito-toolbar__btn"
          onClick={() => onZoom(-1)}
          aria-label="Acercar"
          title="Acercar"
        >
          <Icon name="plus" size={18} />
        </button>

        <span className="ito-toolbar__divider" aria-hidden="true" />

        <button
          type="button"
          className="ito-toolbar__btn"
          onClick={() => onZoom(1)}
          aria-label="Alejar"
          title="Alejar"
        >
          <Icon name="minus" size={18} />
        </button>
      </div>

      <button
        type="button"
        className="ito-toolbar__btn"
        onClick={onResetView}
        aria-label="Vista general del campus"
        title="Vista general"
      >
        <Icon name="home" size={18} />
      </button>

      {canUseAdvancedTools && (
        <>
          <button
            type="button"
            className={`ito-toolbar__btn ${showNavigationDebug ? "is-active" : ""}`}
            onClick={onToggleNavigationDebug}
            aria-label="Mostrar nodos y rutas de depuracion"
            aria-pressed={showNavigationDebug}
            title={debugTitle}
          >
            <Icon name="layers" size={18} />
          </button>

          <button
            type="button"
            className={`ito-toolbar__btn ${draftEditorActive ? "is-active" : ""}`}
            onClick={onToggleDraftEditor}
            aria-label="Dibujar ruta temporal"
            aria-pressed={draftEditorActive}
            title={draftEditorActive ? "Salir del editor temporal" : "Dibujar ruta"}
          >
            <Icon name="edit" size={17} />
          </button>
        </>
      )}
    </div>
  );
}

type CategoryLegendProps = {
  buildings: Building[];
};

function CategoryLegend({ buildings }: CategoryLegendProps) {
  const items = useMemo(() => {
    const seen = new Map<
      string,
      { name: string; color: string; count: number }
    >();

    for (const building of buildings) {
      if (!building.is_active) continue;

      const accent = getCategoryAccent(building.category_name);
      const color = building.category_color || accent.fg;
      const key = building.category_name;
      const existing = seen.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        seen.set(key, {
          name: building.category_name,
          color,
          count: 1,
        });
      }
    }

    return Array.from(seen.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [buildings]);

  if (items.length === 0) return null;

  return (
    <div className="ito-legend anim-fade-in" aria-label="Leyenda de categorÃ­as">
      <div className="ito-legend__title">CategorÃ­as</div>

      <div className="ito-legend__items">
        {items.map((item) => (
          <div key={item.name} className="ito-legend__item">
            <span
              className="ito-legend__swatch"
              style={{ background: item.color }}
              aria-hidden="true"
            />
            <span style={{ flex: 1 }}>{item.name}</span>
            <span
              style={{
                color: "var(--color-text-muted)",
                fontWeight: 600,
              }}
            >
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewerLoading({ isExiting = false }: { isExiting?: boolean }) {
  return (
    <div
      className={`ito-viewer-loading${isExiting ? " is-exiting" : ""}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="ito-viewer-loading__inner">
        <div className="ito-viewer-loading__spinner" aria-hidden="true" />
        <div className="ito-viewer-loading__title">Cargando campus 3D…</div>
        <div className="ito-viewer-loading__subtitle">
          Preparando tu mapa interactivo
        </div>
        <div className="ito-viewer-loading__dots" aria-hidden="true">
          <span className="ito-viewer-loading__dot" />
          <span className="ito-viewer-loading__dot" />
          <span className="ito-viewer-loading__dot" />
        </div>
      </div>
    </div>
  );
}

type CameraAnim = { pos: Vector3; look: Vector3 };

function CameraAnimator({
  animRef,
  controlsRef,
}: {
  animRef: { current: CameraAnim | null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: { current: any };
}) {
  useFrame((_, delta) => {
    const anim = animRef.current;
    const ctrl = controlsRef.current;

    if (!anim || !ctrl) {
      // Restore user interaction when no animation is active
      if (ctrl && !ctrl.enabled) ctrl.enabled = true;
      return;
    }

    // Suppress drei's automatic OrbitControls.update() (priority -1).
    // drei checks `controls.enabled` before calling update(), so setting it
    // false here (we run at -2, before drei at -1) prevents OrbitControls
    // from overwriting our lerped positions each frame.
    ctrl.enabled = false;

    // Frame-rate independent lerp — 97 % of the way in ~0.5 s
    const alpha = 1 - Math.pow(0.001, delta);
    ctrl.object.position.lerp(anim.pos, alpha);
    ctrl.target.lerp(anim.look, alpha);
    // Manual update syncs OrbitControls' internal spherical state and
    // rotates the camera to face ctrl.target
    ctrl.update();

    if (
      ctrl.object.position.distanceTo(anim.pos) < 0.5 &&
      ctrl.target.distanceTo(anim.look) < 0.5
    ) {
      ctrl.object.position.copy(anim.pos);
      ctrl.target.copy(anim.look);
      ctrl.update();
      ctrl.enabled = true;  // hand control back to the user
      animRef.current = null;
    }
  }, -2); // priority -2: runs before drei OrbitControls (priority -1)
  return null;
}

export function CampusViewer({
  isMobile = false,
  mobilePanelOpen = false,
  enableAdminTools = false,
  hideCategoryLegend = false,
}: CampusViewerProps) {
  // OrbitControls ref type from @react-three/drei uses three-stdlib internals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const cameraAnimRef = useRef<CameraAnim | null>(null);
  const mapPosition = useLocationStore((state) => state.mapPosition);
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  // Tracks the last route destination to avoid re-triggering on GPS updates
  const prevRouteRef = useRef<typeof routeDestination | undefined>(undefined);
  const adminUser = useAdminAuthStore((state) => state.user);
  const isAdminAuthenticated = useAdminAuthStore(
    (state) => state.isAuthenticated
  );
  const canUseAdvancedTools =
    isAdminAuthenticated &&
    (adminUser?.role === "superadmin" ||
      (enableAdminTools && adminUser?.role === "admin"));

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [focus, setFocus] = useState<FocusPoint | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isLoadingExiting, setIsLoadingExiting] = useState(false);
  const [navigationDebugMode, setNavigationDebugMode] =
    useState<NavigationDebugMode>("hidden");
  const [draftEditorActive, setDraftEditorActive] = useState(false);
  const [weatherMode, setWeatherMode] = useState<WeatherMode>("cloudy");
  const draftEditor = useDraftEditor();

  useEffect(() => {
    if (canUseAdvancedTools) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNavigationDebugMode("hidden");
    setDraftEditorActive(false);
  }, [canUseAdvancedTools]);

  useEffect(() => {
    const fetchBuildings = canUseAdvancedTools ? getAdminBuildings : getBuildings;
    fetchBuildings().then(setBuildings);
  }, [canUseAdvancedTools]);

  useEffect(() => {
    startUserLocationTracking({ isMobile });
    return () => stopUserLocationTracking();
  }, [isMobile]);

  useEffect(() => {
    let cancelled = false;

    async function syncWeather() {
      try {
        const response = await fetch(OAXACA_WEATHER_URL, {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as OpenMeteoCurrentWeather;
        const nextMode = weatherCodeToMode(data.current);

        if (!cancelled) {
          setWeatherMode(nextMode);
        }
      } catch {
        // Keep the current fallback mode if the weather service is unavailable.
      }
    }

    void syncWeather();
    const interval = window.setInterval(syncWeather, 10 * 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;

    if (isMobile) {
      controls.target.set(0, 0, 30);
      controls.object.position.set(0, 130, 200);
    } else {
      controls.target.set(0, 0, 0);
      controls.object.position.set(0, 180, 0);
    }

    controls.update();
  }, [isMobile]);

  useEffect(() => {
    if (!focus) return;
    const world = campusLocalToWorld(focus.x, focus.z);
    cameraAnimRef.current = {
      pos: isMobile
        ? new Vector3(world.x + 40, 95, world.z + 110)
        : new Vector3(world.x + 40, 90, world.z + 60),
      look: new Vector3(world.x, 0, world.z),
    };
  }, [focus, isMobile]);

  useEffect(() => {
    if (
      !selectedBuilding ||
      selectedBuilding.x == null ||
      selectedBuilding.z == null
    ) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFocus({
      x: selectedBuilding.x,
      z: selectedBuilding.z,
    });
  }, [selectedBuilding]);

  useEffect(() => {
    if (!routeDestination || !mapPosition || !controlsRef.current) return;
    // Only animate when the destination itself changes, not on every GPS update
    if (routeDestination === prevRouteRef.current) return;
    prevRouteRef.current = routeDestination;
    cameraAnimRef.current = {
      pos: new Vector3().copy(controlsRef.current.object.position),
      look: new Vector3(mapPosition.x, 0, mapPosition.z),
    };
  }, [routeDestination, mapPosition]);

  useEffect(() => {
    if (buildings.length > 0) {
      const exitTimer = setTimeout(() => setIsLoadingExiting(true), 300);
      const removeTimer = setTimeout(() => setIsModelLoading(false), 680);
      return () => {
        clearTimeout(exitTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [buildings.length]);

  const handleFocusUser = () => {
    if (!mapPosition) return;

    setFocus({
      x: mapPosition.x,
      z: mapPosition.z,
    });
  };

  const handleResetView = () => {
    setFocus(null);
    cameraAnimRef.current = {
      pos: isMobile ? new Vector3(0, 130, 200) : new Vector3(0, 180, 0),
      look: isMobile ? new Vector3(0, 0, 30) : new Vector3(0, 0, 0),
    };
  };

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
  const hideBuildingLabels = showNavigationDebug || draftEditorActive;
  const weather = WEATHER_PRESETS[weatherMode];

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", cursor: draftEditorActive ? "crosshair" : undefined }}>
      {!mobilePanelOpen && (
        <ViewerToolbar
          hasLocation={hasLocation}
          navigationDebugMode={navigationDebugMode}
          draftEditorActive={draftEditorActive}
          onFocusUser={handleFocusUser}
          onResetView={handleResetView}
          onZoom={handleZoom}
          onToggleNavigationDebug={() =>
            setNavigationDebugMode((current) => {
              if (current === "hidden") return "all";
              if (current === "all") return "issues";
              return "hidden";
            })
          }
          onToggleDraftEditor={() =>
            setDraftEditorActive((current) => !current)
          }
          canUseAdvancedTools={canUseAdvancedTools}
          isMobile={isMobile}
        />
      )}

      {canUseAdvancedTools && !isMobile && !mobilePanelOpen && !hideCategoryLegend && (
        <CategoryLegend buildings={buildings} />
      )}

      {isModelLoading && <ViewerLoading isExiting={isLoadingExiting} />}

      {canUseAdvancedTools && draftEditorActive && (
        <NavigationEditorModal
          controls={draftEditor}
          buildings={buildings}
          onClose={() => setDraftEditorActive(false)}
        />
      )}

      <Canvas
        dpr={[1, 2]}
        camera={{
          position: isMobile ? [0, 130, 200] : [0, 180, 0],
          fov: isMobile ? 45 : 45,
        }}
      >
        <color attach="background" args={[weather.sky]} />
        <fog attach="fog" args={[weather.fog, weather.fogNear, weather.fogFar]} />
        <ambientLight intensity={weather.ambient} />
        <hemisphereLight args={["#dbeafe", "#94a3b8", weather.hemisphere]} />
        <directionalLight
          position={[60, 90, 30]}
          intensity={weather.directional}
          castShadow={false}
        />
        <StormFlash active={weatherMode === "storm"} />

        <gridHelper
          args={[500, 50, weather.gridPrimary, weather.gridSecondary]}
          position={[0, -0.4, 0]}
        />

        <OrbitControls
          ref={controlsRef}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={20}
          maxDistance={350}
          enableDamping
          dampingFactor={0.08}
        />
        <CameraAnimator animRef={cameraAnimRef} controlsRef={controlsRef} />

        <Suspense fallback={null}>
          <group rotation={[0, CAMPUS_ROTATION_Y, 0]}>
            <CampusModel />
            {canUseAdvancedTools && showNavigationDebug && !draftEditorActive && (
              <NavigationDebugLayer
                showOnlyIssues={navigationDebugMode === "issues"}
              />
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
            <WeatherParticles mode={weatherMode} isMobile={isMobile} />
            {!hideBuildingLabels && (
              <BuildingLabels buildings={buildings} isMobile={isMobile} />
            )}
          </group>
        </Suspense>
      </Canvas>

      <WeatherAtmosphere mode={weatherMode} />
    </div>
  );
}

useGLTF.preload(MODEL_PATH);


