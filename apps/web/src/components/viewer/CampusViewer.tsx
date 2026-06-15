import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Vector3 } from "three";
import type { Building } from "../../features/buildings/types/building";
import { useLocationStore } from "../../store/location-store";
import { useBuildingStore } from "../../store/building-store";
import { useAdminAuthStore } from "../../store/admin-auth-store";
import { useBuildings } from "../../hooks/useBuildings";
import {
  startUserLocationTracking,
  stopUserLocationTracking,
} from "../../features/location/services/geolocation";
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
import { CameraAnimator, type CameraAnim } from "./CameraAnimator";
import { CampusModel, MODEL_PATH } from "./CampusModel";
import { CategoryLegend } from "./CategoryLegend";
import { UserLocationMarker } from "./UserLocationMarker";
import { ViewerLoading } from "./ViewerLoading";
import { ViewerToolbar, type NavigationDebugMode } from "./ViewerToolbar";
import { useWeather } from "./weather/useWeather";
import { WeatherLayer, WeatherOverlay } from "./weather/WeatherLayer";
import { WeatherControls } from "./weather/WeatherControls";
import { WEATHER_DEFS, ITO_LAT, ITO_LON } from "./weather/weatherConfig";

const CAMPUS_ROTATION_Y = Math.PI / 2;
const CAMPUS_POSITION_X = 0;
const CAMPUS_POSITION_Z = 0;

type FocusPoint = { x: number; z: number };

type CampusViewerProps = {
  isMobile?: boolean;
  mobilePanelOpen?: boolean;
  enableAdminTools?: boolean;
  hideCategoryLegend?: boolean;
};

function campusLocalToWorld(x: number, z: number) {
  const cos = Math.cos(CAMPUS_ROTATION_Y);
  const sin = Math.sin(CAMPUS_ROTATION_Y);
  return {
    x: x * cos + z * sin + CAMPUS_POSITION_X,
    z: -x * sin + z * cos + CAMPUS_POSITION_Z,
  };
}

type BuildingLabelEntry = {
  buildingId: string;
  name: string;
  accentColor: string;
  x: number;
  y: number;
  z: number;
};

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
  const { scene } = useGLTF(MODEL_PATH);

  const labels = useMemo<BuildingLabelEntry[]>(() => {
    scene.updateMatrixWorld(true);
    const result: BuildingLabelEntry[] = [];

    for (const building of buildings) {
      if (!building.is_active) continue;

      let local: Vector3 | null = null;

      if (building.model_node_name) {
        const glbName = resolveGlbName(building.model_node_name);
        const node = scene.getObjectByName(glbName);

        if (node) {
          const box = new Box3().setFromObject(node);

          if (!box.isEmpty()) {
            const topWorld = new Vector3(
              (box.min.x + box.max.x) / 2,
              box.max.y,
              (box.min.z + box.max.z) / 2,
            );
            local = scene.worldToLocal(topWorld);
          }
        }
      }

      if (!local) continue;

      const accent = getCategoryAccent(building.category_name);
      result.push({
        buildingId: building.id,
        name: building.name,
        accentColor: building.category_color || accent.fg,
        x: local.x,
        y: local.y + 3,
        z: local.z,
      });
    }

    return result;
  }, [scene, buildings]);

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
        return (
          <Html
            key={label.buildingId}
            position={[label.x, label.y, label.z]}
            occlude
            zIndexRange={[isSelected ? 35 : 25, 0]}
          >
            <button
              type="button"
              onClick={() => handleSelect(label.buildingId)}
              style={{
                transform: "translateX(-50%) translateY(-100%)",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: isMobile ? "3px 8px" : "4px 10px 4px 6px",
                borderRadius: 999,
                border: `1.5px solid ${isSelected ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.14)"}`,
                background: isSelected ? label.accentColor : "rgba(8,14,28,0.80)",
                color: "#f1f5f9",
                fontSize: isMobile ? 10 : 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
                cursor: "pointer",
                boxShadow: isSelected
                  ? `0 4px 16px ${label.accentColor}55`
                  : "0 2px 8px rgba(0,0,0,0.32)",
                fontFamily: "Inter, system-ui, sans-serif",
                letterSpacing: "0.01em",
                userSelect: "none",
                pointerEvents: "auto",
                touchAction: "manipulation",
                outline: "none",
              }}
            >
              <span
                style={{
                  width: isMobile ? 6 : 7,
                  height: isMobile ? 6 : 7,
                  borderRadius: "50%",
                  background: isSelected ? "rgba(255,255,255,0.5)" : label.accentColor,
                  flexShrink: 0,
                }}
              />
              {label.name}
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
}: CampusViewerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const cameraAnimRef = useRef<CameraAnim | null>(null);

  const mapPosition = useLocationStore((state) => state.mapPosition);
  const geoPosition = useLocationStore((state) => state.geoPosition);

  // Round to ~1 km to avoid re-fetching on minor GPS jitter
  const weatherLat = geoPosition
    ? Math.round(geoPosition.latitude  * 100) / 100
    : ITO_LAT;
  const weatherLon = geoPosition
    ? Math.round(geoPosition.longitude * 100) / 100
    : ITO_LON;

  const { mode: weatherMode, control: weatherControl, setControl: setWeatherControl } =
    useWeather(weatherLat, weatherLon);

  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const prevRouteRef = useRef<typeof routeDestination | undefined>(undefined);

  const adminUser = useAdminAuthStore((state) => state.user);
  const isAdminAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const canUseAdvancedTools =
    isAdminAuthenticated &&
    (adminUser?.role === "superadmin" ||
      (enableAdminTools && adminUser?.role === "admin"));

  const { buildings } = useBuildings({ admin: canUseAdvancedTools });
  const [focus, setFocus] = useState<FocusPoint | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isLoadingExiting, setIsLoadingExiting] = useState(false);
  const [navigationDebugMode, setNavigationDebugMode] =
    useState<NavigationDebugMode>("hidden");
  const [draftEditorActive, setDraftEditorActive] = useState(false);
  const draftEditor = useDraftEditor();

  useEffect(() => {
    if (canUseAdvancedTools) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNavigationDebugMode("hidden");
    setDraftEditorActive(false);
  }, [canUseAdvancedTools]);

  useEffect(() => {
    startUserLocationTracking({ isMobile });
    return () => stopUserLocationTracking();
  }, [isMobile]);

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
    if (routeDestination) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFocus({ x: selectedBuilding.x, z: selectedBuilding.z });
  }, [selectedBuilding, routeDestination]);

  useEffect(() => {
    if (!routeDestination || !mapPosition) return;
    if (routeDestination === prevRouteRef.current) return;
    prevRouteRef.current = routeDestination;

    const userWorld = campusLocalToWorld(mapPosition.x, mapPosition.z);
    const destWorld =
      routeDestination.x != null && routeDestination.z != null
        ? campusLocalToWorld(routeDestination.x, routeDestination.z)
        : userWorld;

    const midX = (userWorld.x + destWorld.x) / 2;
    const midZ = (userWorld.z + destWorld.z) / 2;

    const span = Math.sqrt(
      Math.pow(destWorld.x - userWorld.x, 2) +
        Math.pow(destWorld.z - userWorld.z, 2),
    );
    const camHeight = Math.min(Math.max(span * 0.85 + 50, 70), 210);
    const pullZ = isMobile ? 35 : 12;

    cameraAnimRef.current = {
      pos: new Vector3(midX, camHeight, midZ + pullZ),
      look: new Vector3(midX, 0, midZ),
    };
  }, [routeDestination, mapPosition, isMobile]);

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
    setFocus({ x: mapPosition.x, z: mapPosition.z });
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
  const scene = WEATHER_DEFS[weatherMode].scene;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        cursor: draftEditorActive ? "crosshair" : undefined,
      }}
    >
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
          onToggleDraftEditor={() => setDraftEditorActive((current) => !current)}
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
          fov: 45,
        }}
      >
        <color attach="background" args={[scene.sky]} />
        <fog attach="fog" args={[scene.fog, scene.fogNear, scene.fogFar]} />
        <ambientLight intensity={scene.ambient} />
        <hemisphereLight args={["#ffedd5", "#94a3b8", scene.hemisphere]} />
        <directionalLight
          position={[60, 90, 30]}
          intensity={scene.directional}
          castShadow={false}
        />

        <gridHelper
          args={[500, 50, scene.gridPrimary, scene.gridSecondary]}
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
            <WeatherLayer mode={weatherMode} isMobile={isMobile} />
          </group>
        </Suspense>
      </Canvas>

      <WeatherOverlay mode={weatherMode} />

      {canUseAdvancedTools && (
        <WeatherControls
          mode={weatherMode}
          control={weatherControl}
          onControlChange={setWeatherControl}
        />
      )}
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
