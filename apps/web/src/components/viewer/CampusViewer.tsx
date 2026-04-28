import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import type { Building } from "../../features/buildings/types/building";
import { useLocationStore } from "../../store/location-store";
import { useBuildingStore } from "../../store/building-store";
import { getBuildings } from "../../services/buildings.service";
import { startUserLocationTracking } from "../../features/location/services/geolocation";
import { RouteLine } from "../../features/buildings/components/RouteLine";

const MODEL_PATH = "/models/campus.glb";

const CAMPUS_ROTATION_Y = Math.PI / 2;
const CAMPUS_POSITION_X = 0;
const CAMPUS_POSITION_Z = 0;

const LABEL_DISTANCE_LIMIT = 190;

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

  if (!mapPosition) return null;

  return (
    <group position={[mapPosition.x, 8, mapPosition.z]}>
      <mesh rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[4, 12, 32]} />
        <meshStandardMaterial color="#ef1c25" />
      </mesh>

      <mesh position={[0, 6, 0]}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshStandardMaterial color="#ef1c25" />
      </mesh>
    </group>
  );
}

type BuildingLabelsProps = {
  buildings: Building[];
  isMobile?: boolean;
};

function BuildingLabels({ buildings, isMobile = false }: BuildingLabelsProps) {
  const { camera } = useThree();
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const [visible, setVisible] = useState(false);

  useFrame(() => {
    setVisible(camera.position.length() < LABEL_DISTANCE_LIMIT);
  });

  if (!visible) return null;

  const buildingsToRender = isMobile
    ? buildings.filter((building) => building.id === selectedBuilding?.id)
    : buildings;

  return (
    <>
      {buildingsToRender.map((building) => {
        if (building.x == null || building.z == null) {
          return null;
        }

        const y = (building.y ?? 0) + 8;

        return (
          <Html
            key={building.id}
            position={[building.x, y, building.z]}
            center
          >
            <div
              style={{
                background: "#111827",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "999px",
                fontSize: "11px",
                maxWidth: isMobile ? "90px" : "none",
                textAlign: "center",
                lineHeight: 1.25,
              }}
            >
              {building.name}
            </div>
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

type FocusUserButtonProps = {
  onClick: () => void;
  isMobile?: boolean;
};

function FocusUserButton({ onClick, isMobile = false }: FocusUserButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        right: "calc(16px + env(safe-area-inset-right))",
        bottom: isMobile
          ? "calc(20px + env(safe-area-inset-bottom))"
          : "calc(88px + env(safe-area-inset-bottom))",
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "none",
        background: "#fff",
        fontSize: 24,
        boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
        zIndex: 100,
      }}
    >
      📍
    </button>
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
    if (!selectedBuilding || selectedBuilding.x == null || selectedBuilding.z == null) {
      return;
    }

    setFocus({
      x: selectedBuilding.x,
      z: selectedBuilding.z,
    });
  }, [selectedBuilding]);

  const handleFocus = () => {
    if (!mapPosition) return;

    setFocus({
      x: mapPosition.x,
      z: mapPosition.z,
    });
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {!mobilePanelOpen && (
        <FocusUserButton onClick={handleFocus} isMobile={isMobile} />
      )}

      <Canvas
        camera={{
          position: isMobile ? [0, 115, 185] : [0, 180, 0],
          fov: isMobile ? 42 : 45,
        }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[50, 80, 20]} intensity={2} />
        <gridHelper args={[500, 100]} />

        <OrbitControls
          ref={controlsRef}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={20}
          maxDistance={350}
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