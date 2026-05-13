import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import type { Mesh, MeshBasicMaterial, RingGeometry } from "three";
import type { Building } from "../../features/buildings/types/building";
import { useLocationStore } from "../../store/location-store";
import { useBuildingStore } from "../../store/building-store";
import { getBuildings } from "../../services/buildings.service";
import { startUserLocationTracking } from "../../features/location/services/geolocation";
import { RouteLine } from "../../features/buildings/components/RouteLine";
import { Icon, type IconName } from "../ui/Icons";
import { getCategoryAccent } from "../ui/categoryAccent";

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
};

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

  useFrame(({ clock }) => {
    if (!ringRef.current) return;

    const t = (clock.getElapsedTime() % 1.6) / 1.6;
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
            Ubicación aproximada
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

  return <primitive object={scene} />;
}

type ViewerToolbarProps = {
  hasLocation: boolean;
  onFocusUser: () => void;
  onResetView: () => void;
  onZoom: (delta: number) => void;
  isMobile?: boolean;
};

function ViewerToolbar({
  hasLocation,
  onFocusUser,
  onResetView,
  onZoom,
  isMobile = false,
}: ViewerToolbarProps) {
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
        aria-label="Centrar en mi ubicación"
        title={hasLocation ? "Centrar en mi ubicación" : "Esperando ubicación…"}
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
    <div className="ito-legend anim-fade-in" aria-label="Leyenda de categorías">
      <div className="ito-legend__title">Categorías</div>

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

function ViewerLoading() {
  return (
    <div className="ito-viewer-loading" aria-live="polite" aria-busy="true">
      <div className="ito-viewer-loading__inner">
        <div className="ito-viewer-loading__spinner" aria-hidden="true" />
        <div className="ito-viewer-loading__title">Cargando campus 3D…</div>
        <div className="ito-viewer-loading__subtitle">
          Preparando tu mapa interactivo
        </div>
      </div>
    </div>
  );
}

export function CampusViewer({
  isMobile = false,
  mobilePanelOpen = false,
}: CampusViewerProps) {
  // OrbitControls ref type from @react-three/drei uses three-stdlib internals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const mapPosition = useLocationStore((state) => state.mapPosition);
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [focus, setFocus] = useState<FocusPoint | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);

  useEffect(() => {
    getBuildings().then(setBuildings);
    startUserLocationTracking();
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
    if (!focus || !controlsRef.current) return;

    const world = campusLocalToWorld(focus.x, focus.z);
    const controls = controlsRef.current;

    controls.target.set(world.x, 0, world.z);

    if (isMobile) {
      controls.object.position.set(world.x + 40, 95, world.z + 110);
    } else {
      controls.object.position.set(world.x + 40, 90, world.z + 60);
    }

    controls.update();
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
    if (buildings.length > 0) {
      const timeoutId = setTimeout(() => setIsModelLoading(false), 300);

      return () => clearTimeout(timeoutId);
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
    if (!controlsRef.current) return;

    const controls = controlsRef.current;

    setFocus(null);

    if (isMobile) {
      controls.target.set(0, 0, 30);
      controls.object.position.set(0, 130, 200);
    } else {
      controls.target.set(0, 0, 0);
      controls.object.position.set(0, 180, 0);
    }

    controls.update();
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

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {!mobilePanelOpen && (
        <ViewerToolbar
          hasLocation={hasLocation}
          onFocusUser={handleFocusUser}
          onResetView={handleResetView}
          onZoom={handleZoom}
          isMobile={isMobile}
        />
      )}

      {!isMobile && !mobilePanelOpen && <CategoryLegend buildings={buildings} />}

      {isModelLoading && <ViewerLoading />}

      <Canvas
        dpr={[1, 2]}
        camera={{
          position: isMobile ? [0, 130, 200] : [0, 180, 0],
          fov: isMobile ? 45 : 45,
        }}
      >
        <color attach="background" args={["#eef4fb"]} />
        <fog attach="fog" args={["#eef4fb", 250, 480]} />
        <ambientLight intensity={1.2} />
        <hemisphereLight args={["#dbeafe", "#94a3b8", 0.6]} />
        <directionalLight
          position={[60, 90, 30]}
          intensity={1.6}
          castShadow={false}
        />

        <gridHelper
          args={[500, 50, "#cbd5e1", "#e2e8f0"]}
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

        <Suspense fallback={null}>
          <group rotation={[0, CAMPUS_ROTATION_Y, 0]}>
            <CampusModel />
            <RouteLine />
            <UserLocationMarker />
            <BuildingLabels buildings={buildings} isMobile={isMobile} />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);