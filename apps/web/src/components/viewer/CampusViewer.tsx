import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Object3D } from "three";
import type { Building } from "../../features/buildings/types/building";
import { useLocationStore } from "../../store/location-store";
import { useBuildingStore } from "../../store/building-store";
import { useAdminAuthStore } from "../../store/admin-auth-store";
import { useBuildings } from "../../hooks/useBuildings";
import {
  startUserLocationTracking,
  stopUserLocationTracking,
  haversineMeters,
} from "../../features/location/services/geolocation";
import { SetBuildingGpsPanel } from "./SetBuildingGpsPanel";
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

const CAMPUS_ROTATION_Y = Math.PI / 2;
const CAMPUS_POSITION_X = 0;
const CAMPUS_POSITION_Z = 0;
const DEFAULT_SCENE = {
  sky: "#e6f3ff",
  fog: "#e6f3ff",
  fogNear: 360,
  fogFar: 700,
  ambient: 1.4,
  hemisphere: 0.75,
  directional: 2.1,
  gridPrimary: "#b8cce0",
  gridSecondary: "#d0e3f0",
};
const BASE_DETECTION_THRESHOLD_METERS = 70;
const MAX_DETECTION_THRESHOLD_METERS = 150;

function getDetectionThreshold(accuracy: number | null): number {
  if (accuracy === null) return BASE_DETECTION_THRESHOLD_METERS;
  return Math.min(
    Math.max(BASE_DETECTION_THRESHOLD_METERS, accuracy * 1.5),
    MAX_DETECTION_THRESHOLD_METERS
  );
}

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
  alias: string;
  accentColor: string;
  x: number;
  y: number;
  z: number;
};

function getBuildingAlias(building: Building): string {
  return building.code.trim() || building.name;
}

function toRuntimeGlbName(name: string): string {
  return name.replace(/\s/g, "_").replace(/\./g, "");
}

function findSceneObjectByModelName(scene: Object3D, modelName: string) {
  const direct = scene.getObjectByName(modelName);
  if (direct) return direct;

  const runtimeName = toRuntimeGlbName(modelName);
  return scene.getObjectByName(runtimeName) ?? null;
}

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
    const nodeUseCounts = new Map<string, number>();
    const missingNodes: string[] = [];

    for (const building of buildings) {
      if (!building.is_active || !building.model_node_name) continue;

      const glbName = resolveGlbName(building.model_node_name);
      const node = findSceneObjectByModelName(scene, glbName);
      if (!node) {
        missingNodes.push(`${building.code}: ${glbName}`);
        continue;
      }

      const box = new Box3().setFromObject(node);
      if (box.isEmpty()) continue;

      const topWorld = new Vector3(
        (box.min.x + box.max.x) / 2,
        box.max.y,
        (box.min.z + box.max.z) / 2,
      );
      const local = scene.worldToLocal(topWorld);

      const stackIdx = nodeUseCounts.get(glbName) ?? 0;
      nodeUseCounts.set(glbName, stackIdx + 1);

      const angle = stackIdx * 1.2;
      const radius = stackIdx === 0 ? 0 : 5 + stackIdx * 1.5;
      const accent = getCategoryAccent(building.category_name);
      result.push({
        buildingId: building.id,
        name: building.name,
        alias: getBuildingAlias(building),
        accentColor: building.category_color || accent.fg,
        x: local.x + Math.cos(angle) * radius,
        y: local.y + 4 + stackIdx * 1.8,
        z: local.z + Math.sin(angle) * radius,
      });
    }

    if (import.meta.env.DEV) {
      console.info("[CampusViewer] etiquetas 3D", {
        buildings: buildings.length,
        labels: result.length,
        missingNodes,
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
            zIndexRange={[isSelected ? 60 : 50, 0]}
          >
            <button
              type="button"
              aria-label={label.name}
              title={label.name}
              onClick={() => handleSelect(label.buildingId)}
              style={{
                transform: "translateX(-50%) translateY(-100%)",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: isMobile ? "3px 7px" : "4px 8px 4px 6px",
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
              {label.alias}
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
  const simulatedPosition = useLocationStore((state) => state.simulatedPosition);
  const setMapPosition = useLocationStore((state) => state.setMapPosition);
  const setNearestBuilding = useLocationStore((state) => state.setNearestBuilding);

  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const routeDestination = useBuildingStore((state) => state.routeDestination);
  const prevRouteRef = useRef<typeof routeDestination | undefined>(undefined);

  const adminUser = useAdminAuthStore((state) => state.user);
  const isAdminAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const canUseAdvancedTools =
    isAdminAuthenticated &&
    (adminUser?.role === "superadmin" ||
      (enableAdminTools && adminUser?.role === "admin"));

  const [buildingsVersion, setBuildingsVersion] = useState(0);
  const { buildings } = useBuildings({ admin: canUseAdvancedTools, version: buildingsVersion });
  const [focus, setFocus] = useState<FocusPoint | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isLoadingExiting, setIsLoadingExiting] = useState(false);
  const [navigationDebugMode, setNavigationDebugMode] =
    useState<NavigationDebugMode>("hidden");
  const [draftEditorActive, setDraftEditorActive] = useState(false);
  const [gpsRecorderOpen, setGpsRecorderOpen] = useState(false);
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
    if (simulatedPosition) return;

    if (!geoPosition || buildings.length === 0) {
      setMapPosition(null);
      setNearestBuilding(null);
      return;
    }

    let nearest: { building: Building; distMeters: number } | null = null;

    for (const building of buildings) {
      if (
        !building.is_active ||
        building.latitude == null ||
        building.longitude == null ||
        building.x == null ||
        building.z == null
      ) {
        continue;
      }

      const dist = haversineMeters(
        geoPosition.latitude,
        geoPosition.longitude,
        Number(building.latitude),
        Number(building.longitude)
      );

      if (!nearest || dist < nearest.distMeters) {
        nearest = { building, distMeters: dist };
      }
    }

    const threshold = getDetectionThreshold(geoPosition.accuracy);

    if (nearest && nearest.distMeters <= threshold) {
      setMapPosition({ x: Number(nearest.building.x), y: 2, z: Number(nearest.building.z) });
      setNearestBuilding({
        buildingId: nearest.building.id,
        buildingCode: nearest.building.code,
        buildingName: nearest.building.name,
        distanceMeters: nearest.distMeters,
      });
    } else {
      setMapPosition(null);
      setNearestBuilding(null);
    }
  }, [buildings, geoPosition, simulatedPosition, setMapPosition, setNearestBuilding]);

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
  const scene = DEFAULT_SCENE;

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
          gpsRecorderOpen={gpsRecorderOpen}
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
          onToggleGpsRecorder={() => setGpsRecorderOpen((current) => !current)}
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
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
