
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import type { Building } from "../../features/buildings/types/building";
import { useLocationStore } from "../../store/location-store";
import { useBuildingStore } from "../../store/building-store";
import { getBuildings } from "../../services/buildings.service";
import { startUserLocationTracking } from "../../features/location/services/geolocation";
import { RouteLine } from "../../features/buildings/components/RouteLine";
import { Icon, type IconName } from "../ui/Icons";
import { getCategoryAccent } from "../ui/CategoryBadge";

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
  const mapPosition = useLocationStore((s) => s.mapPosition);
  const ringRef = useRef<any>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = (clock.getElapsedTime() % 1.6) / 1.6;
    const scale = 1 + t * 1.4;
    ringRef.current.scale.set(scale, scale, scale);
    ringRef.current.material.opacity = (1 - t) * 0.55;
  });

  if (!mapPosition) return null;

  return (
    <group position={[mapPosition.x, 4, mapPosition.z]}>
      {/* Pulsing ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.1, 0]}
      >
        <ringGeometry args={[5.5, 7, 48]} />
        <meshBasicMaterial color="#2563eb" transparent opacity={0.55} />
      </mesh>

      {/* Inner solid disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <circleGeometry args={[5, 48]} />
        <meshBasicMaterial color="#2563eb" transparent opacity={0.18} />
      </mesh>

      {/* Pin head */}
      <mesh position={[0, 8, 0]}>
        <sphereGeometry args={[2.6, 32, 32]} />
        <meshStandardMaterial
          color="#2563eb"
          emissive="#1d4ed8"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Pin core */}
      <mesh position={[0, 8, 0]}>
        <sphereGeometry args={[1.1, 24, 24]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
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
    (state) => state.setSelectedBuilding,
  );

  const buildingsToRender = isMobile
    ? buildings.filter((building) => building.id === selectedBuilding?.id)
    : buildings;

  return (
    <>
      {buildingsToRender.map((building) => {
        if (building.x == null || building.z == null) {
          return null;
        }

        const y = (building.y ?? 0) + 12;
        const isSelected = selectedBuilding?.id === building.id;
        const accent = getCategoryAccent(building.category_name);
        const accentColor = building.category_color || accent.fg;

        return (
          <Html
            key={building.id}
            position={[building.x, y, building.z]}
            center
            zIndexRange={[100, 0]}
            occlude={false}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBuilding(building);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px 6px 8px",
                borderRadius: 999,
                border: `1px solid ${
                  isSelected ? accentColor : "rgba(15,23,42,0.12)"
                }`,
                background: isSelected ? accentColor : "rgba(255,255,255,0.97)",
                color: isSelected ? "#ffffff" : "#0f172a",
                fontSize: 12,
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
              }}
            >
              <span
                aria-hidden="true"
                style={{
                 width: 20,
                 height: 20,
                 borderRadius: 999,
                 background: isSelected ? "#ffffff" : accentColor,
                 color: isSelected ? accentColor : "#ffffff",
                 display: "inline-grid",
                 placeItems: "center",
                 flexShrink: 0,
                 }}
>
                  <Icon name={getBuildingMarkerIcon(building)} size={12} />
              </span>

              <span
                style={{
                  maxWidth: 180,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {building.name}
              </span>
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
};

function ViewerToolbar({
  hasLocation,
  onFocusUser,
  onResetView,
  onZoom,
}: ViewerToolbarProps) {
  return (
    <div className="ito-toolbar">
      <button
        type="button"
        className="ito-toolbar__btn"
        onClick={onResetView}
        aria-label="Vista general del campus"
        title="Vista general"
      >
        <Icon name="home" size={18} />
      </button>
      <button
        type="button"
        className="ito-toolbar__btn"
        onClick={() => onZoom(-1)}
        aria-label="Acercar"
        title="Acercar"
      >
        <Icon name="plus" size={18} />
      </button>
      <button
        type="button"
        className="ito-toolbar__btn"
        onClick={() => onZoom(1)}
        aria-label="Alejar"
        title="Alejar"
      >
        <Icon name="minus" size={18} />
      </button>
      <button
        type="button"
        className={`ito-toolbar__btn ${hasLocation ? "is-active" : ""}`}
        onClick={onFocusUser}
        aria-label="Centrar en mi ubicación"
        title={
          hasLocation
            ? "Centrar en mi ubicación"
            : "Esperando ubicación…"
        }
        disabled={!hasLocation}
        style={!hasLocation ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
      >
        <Icon name="crosshair" size={18} />
      </button>
    </div>
  );
}

type CategoryLegendProps = {
  buildings: Building[];
};

function CategoryLegend({ buildings }: CategoryLegendProps) {
  const items = useMemo(() => {
    const seen = new Map<string, { name: string; color: string; count: number }>();
    for (const b of buildings) {
      if (!b.is_active) continue;
      const accent = getCategoryAccent(b.category_name);
      const color = b.category_color || accent.fg;
      const key = b.category_name;
      const existing = seen.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        seen.set(key, { name: b.category_name, color, count: 1 });
      }
    }
    return Array.from(seen.values()).sort((a, b) => b.count - a.count).slice(0, 6);
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
            <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CampusViewer({
  isMobile = false,
  mobilePanelOpen = false,
}: CampusViewerProps) {
  const controlsRef = useRef<any>(null);
  const mapPosition = useLocationStore((s) => s.mapPosition);
  const selectedBuilding = useBuildingStore((s) => s.selectedBuilding);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [focus, setFocus] = useState<FocusPoint | null>(null);

  useEffect(() => {
    getBuildings().then(setBuildings);
    startUserLocationTracking();
  }, []);

  useEffect(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;

    if (isMobile) {
      controls.target.set(0, 0, 40);
      controls.object.position.set(0, 115, 185);
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

    setFocus({
      x: selectedBuilding.x,
      z: selectedBuilding.z,
    });
  }, [selectedBuilding]);

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
      controls.target.set(0, 0, 40);
      controls.object.position.set(0, 115, 185);
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
        />
      )}

      {!isMobile && !mobilePanelOpen && <CategoryLegend buildings={buildings} />}

      <Canvas
        camera={{
          position: isMobile ? [0, 115, 185] : [0, 180, 0],
          fov: isMobile ? 42 : 45,
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

        <gridHelper args={[500, 50, "#cbd5e1", "#e2e8f0"]} position={[0, -0.4, 0]} />

        <OrbitControls
          ref={controlsRef}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={20}
          maxDistance={350}
          enableDamping
          dampingFactor={0.08}
        />

        <group rotation={[0, CAMPUS_ROTATION_Y, 0]}>
          <CampusModel />
          <RouteLine />
          <UserLocationMarker />
          <BuildingLabels buildings={buildings} isMobile={isMobile} />
        </group>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
