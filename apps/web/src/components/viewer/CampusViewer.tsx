import { useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";

import { useBuildingStore } from "../../store/building-store";
import { useLocationStore } from "../../store/location-store";
import type { Building } from "../../features/buildings/types/building";
import { getBuildings } from "../../services/buildings.service";
import { RouteLine } from "../../features/buildings/components/RouteLine";
import { startUserLocationTracking } from "../../features/location/services/geolocation";

const MODEL_PATH = "/models/campus.glb";
const DEBUG_PICKER = true;

const CAMPUS_ROTATION_Y = Math.PI / 2;
const CAMPUS_POSITION_X = 0;
const CAMPUS_POSITION_Y = 0;
const CAMPUS_POSITION_Z = 0;
const CAMPUS_SCALE = 1;

const LABEL_DISTANCE_LIMIT = 190;

type CursorPosition = {
  x: number;
  y: number;
};

type CampusModelProps = {
  buildings: Building[];
  onSelectName: (name: string | null) => void;
  onHoverChange: (name: string | null, position?: CursorPosition | null) => void;
  onDebugPointChange: (payload: string | null) => void;
};

function formatDebugPoint(point: THREE.Vector3, objectName: string) {
  return `Objeto: ${objectName}
x: ${point.x.toFixed(4)}
y: ${point.y.toFixed(4)}
z: ${point.z.toFixed(4)}`;
}

async function copyDebugPointToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error("No se pudo copiar:", error);
  }
}

function CampusModel({
  buildings,
  onSelectName,
  onHoverChange,
  onDebugPointChange,
}: CampusModelProps) {
  const { scene } = useGLTF(MODEL_PATH);
  const setSelectedBuilding = useBuildingStore((state) => state.setSelectedBuilding);
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  useEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });
  }, [scene]);

  useEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const building = buildings.find((b) => b.model_node_name === child.name);
      const isSelected = selectedBuilding?.model_node_name === child.name;
      const isHovered = hoveredName === child.name;

      const baseColor = building ? "#374151" : "#9ca3af";
      const hoverColor = "#f59e0b";
      const selectedColor = "#dc2626";

      const applyColor = (mat: THREE.Material) => {
        if (!(mat instanceof THREE.MeshStandardMaterial)) return;
        if (isSelected) mat.color.set(selectedColor);
        else if (isHovered) mat.color.set(hoverColor);
        else mat.color.set(baseColor);
      };

      if (Array.isArray(child.material)) child.material.forEach(applyColor);
      else if (child.material) applyColor(child.material);
    });
  }, [scene, buildings, selectedBuilding, hoveredName]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    const obj = e.object;
    if (!(obj instanceof THREE.Mesh)) return;

    const name = obj.name || "Sin nombre";

    if (DEBUG_PICKER && e.nativeEvent.shiftKey) {
      const payload = formatDebugPoint(e.point, name);
      console.log(payload);
      copyDebugPointToClipboard(payload);
      onDebugPointChange(payload);
      return;
    }

    const match = buildings.find((b) => b.model_node_name === name) ?? null;
    setSelectedBuilding(match);
    setHoveredName(name);
    onSelectName(name);
    onHoverChange(null);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    const obj = e.object;
    if (!(obj instanceof THREE.Mesh)) return;

    const name = obj.name || null;
    setHoveredName(name);
    onHoverChange(name, { x: e.clientX, y: e.clientY });
    document.body.style.cursor = "pointer";
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    const obj = e.object;
    if (!(obj instanceof THREE.Mesh)) return;

    const name = obj.name || null;
    setHoveredName(name);
    onHoverChange(name, { x: e.clientX, y: e.clientY });
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredName(null);
    onHoverChange(null);
    document.body.style.cursor = "default";
  };

  return (
    <primitive
      object={scene}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    />
  );
}

function BuildingLabels({ buildings }: { buildings: Building[] }) {
  const { camera } = useThree();
  const [showLabels, setShowLabels] = useState(false);

  useFrame(() => {
    const distance = camera.position.length();
    const shouldShow = distance < LABEL_DISTANCE_LIMIT;

    setShowLabels((current) => {
      if (current === shouldShow) return current;
      return shouldShow;
    });
  });

  if (!showLabels) return null;

  return (
    <>
      {buildings.map((building) => {
        if (building.x === null || building.y === null || building.z === null) {
          return null;
        }

        return (
          <Html
            key={building.id}
            position={[Number(building.x), Number(building.y) + 8, Number(building.z)]}
            center
            distanceFactor={12}
            zIndexRange={[50, 0]}
          >
            <div
              style={{
                background: "rgba(17, 24, 39, 0.9)",
                color: "#ffffff",
                padding: "5px 9px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 700,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
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

function DebugPanel({ point }: { point: string | null }) {
  if (!point) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        background: "#111827",
        color: "#fff",
        padding: "10px",
        borderRadius: "8px",
        fontSize: "12px",
        whiteSpace: "pre-wrap",
        zIndex: 30,
      }}
    >
      {point}
    </div>
  );
}

function UserLocationMarker() {
  const mapPosition = useLocationStore((state) => state.mapPosition);

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

      <mesh
        position={[0, -6.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[4.5, 5.5, 32]} />
        <meshBasicMaterial color="#ef1c25" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function CampusViewer() {
  const setSelectedBuilding = useBuildingStore((state) => state.setSelectedBuilding);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [debugPoint, setDebugPoint] = useState<string | null>(null);

  useEffect(() => {
    getBuildings()
      .then(setBuildings)
      .catch((error) => {
        console.error("Error cargando edificios:", error);
      });
  }, []);

  useEffect(() => {
    startUserLocationTracking();
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <DebugPanel point={debugPoint} />

      <Canvas
        camera={{ position: [0, 180, 0], fov: 45 }}
        onPointerMissed={() => {
          setSelectedBuilding(null);
        }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[50, 80, 20]} intensity={2} />
        <gridHelper args={[500, 100]} />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          maxPolarAngle={Math.PI / 2.2}
          minDistance={20}
          maxDistance={350}
        />

        <group
          rotation={[0, CAMPUS_ROTATION_Y, 0]}
          position={[CAMPUS_POSITION_X, CAMPUS_POSITION_Y, CAMPUS_POSITION_Z]}
          scale={CAMPUS_SCALE}
        >
          <RouteLine />
          <UserLocationMarker />
          <BuildingLabels buildings={buildings} />

          <CampusModel
            buildings={buildings}
            onSelectName={() => {}}
            onHoverChange={() => {}}
            onDebugPointChange={setDebugPoint}
          />
        </group>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);