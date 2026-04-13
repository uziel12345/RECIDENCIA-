import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useBuildingStore } from "../../store/building-store";
import { buildings } from "../../features/buildings/data/buildings";

type CampusModelProps = {
  onSelectName: (name: string) => void;
  onHoverChange: (
    name: string | null,
    position?: { x: number; y: number }
  ) => void;
};

function CampusModel({ onSelectName, onHoverChange }: CampusModelProps) {
  const { scene } = useGLTF("/models/campus.glb");

  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );

  const [hoveredName, setHoveredName] = useState<string | null>(null);

  const model = useMemo(() => {
    const clonedScene = scene.clone(true);

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (Array.isArray(child.material)) {
          child.material = child.material.map((material) => material.clone());
        } else if (child.material) {
          child.material = child.material.clone();
        }
      }
    });

    return clonedScene;
  }, [scene]);

  useEffect(() => {
    const meshNames: string[] = [];

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshNames.push(child.name || "(sin nombre)");
      }
    });

    console.log("MESHES DEL MODELO:");
    console.log(meshNames);
  }, [model]);

  useEffect(() => {
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }

      const material = child.material;
      const isSelected =
        selectedBuilding !== null &&
        child.name === selectedBuilding.modelNodeName;
      const isHovered = hoveredName !== null && child.name === hoveredName;

      let targetColor = "#cccccc";

      if (isSelected) {
        targetColor = "#ef4444";
      } else if (isHovered) {
        targetColor = "#f59e0b";
      }

      if (Array.isArray(material)) {
        material.forEach((mat) => {
          if ("color" in mat) {
            (mat as THREE.MeshStandardMaterial).color.set(targetColor);
          }
        });
      } else if ("color" in material) {
        (material as THREE.MeshStandardMaterial).color.set(targetColor);
      }
    });
  }, [selectedBuilding, hoveredName, model]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    const clickedObject = e.object;

    if (!(clickedObject instanceof THREE.Mesh)) {
      return;
    }

    const clickedName = clickedObject.name || "Edificio sin nombre";

    console.log("OBJETO GOLPEADO:", clickedObject);
    console.log("NOMBRE:", clickedName);

    onSelectName(clickedName);

    const matchedBuilding = buildings.find(
      (building) => building.modelNodeName === clickedName
    );

    if (matchedBuilding) {
      setSelectedBuilding(matchedBuilding);
      return;
    }

    setSelectedBuilding(null);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    const hoveredObject = e.object;

    if (!(hoveredObject instanceof THREE.Mesh)) {
      return;
    }

    const name = hoveredObject.name || null;
    setHoveredName(name);
    onHoverChange(name, { x: e.clientX, y: e.clientY });
    document.body.style.cursor = "pointer";
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    const hoveredObject = e.object;

    if (!(hoveredObject instanceof THREE.Mesh)) {
      return;
    }

    const name = hoveredObject.name || null;
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
      object={model}
      onPointerDown={handlePointerDown}
      onPointerOver={handlePointerOver}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    />
  );
}

function CameraFocusController() {
  const { camera, scene } = useThree();
  const controlsRef = useRef<{
    target: THREE.Vector3;
    update: () => void;
  } | null>(null);

  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);

  const desiredCameraPosition = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);

  useEffect(() => {
    if (!selectedBuilding) {
      return;
    }

    const selectedObject = scene.getObjectByName(selectedBuilding.modelNodeName);

    if (!selectedObject) {
      console.warn(
        "No se encontró el objeto en la escena:",
        selectedBuilding.modelNodeName
      );
      return;
    }

    const box = new THREE.Box3().setFromObject(selectedObject);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();

    box.getCenter(center);
    box.getSize(size);

    const maxDimension = Math.max(size.x, size.y, size.z, 1);
    const distance = maxDimension * 4;

    desiredTarget.current.copy(center);
    desiredCameraPosition.current.set(
      center.x + distance,
      center.y + distance * 0.8,
      center.z + distance
    );

    isAnimating.current = true;
  }, [selectedBuilding, scene]);

  useFrame(() => {
    if (!isAnimating.current) {
      return;
    }

    camera.position.lerp(desiredCameraPosition.current, 0.08);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(desiredTarget.current, 0.08);
      controlsRef.current.update();
    }

    const cameraDone =
      camera.position.distanceTo(desiredCameraPosition.current) < 0.2;

    const targetDone = controlsRef.current
      ? controlsRef.current.target.distanceTo(desiredTarget.current) < 0.2
      : true;

    if (cameraDone && targetDone) {
      isAnimating.current = false;
    }
  });

  return (
    <OrbitControls
      ref={(instance) => {
        if (instance) {
          controlsRef.current = instance;
        }
      }}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

function BuildingLabels() {
  const { scene, camera } = useThree();
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );

  const featuredBuildings = buildings.filter((building) =>
    ["Direccion_", "Biblioteca", "Centro_Computo_"].includes(
      building.modelNodeName
    )
  );

  return (
    <>
      {featuredBuildings.map((building) => {
        const object = scene.getObjectByName(building.modelNodeName);

        if (!object) {
          return null;
        }

        const box = new THREE.Box3().setFromObject(object);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();

        box.getCenter(center);
        box.getSize(size);

        const labelPosition: [number, number, number] = [
          center.x,
          center.y + Math.max(size.y, 4) + 2,
          center.z,
        ];

        const distanceToCamera = camera.position.distanceTo(center);
        const maxDistance = 180;
        const isSelected = selectedBuilding?.id === building.id;

        // Solo ocultar si está muy lejos.
        // Si está seleccionado, mantener visible su etiqueta.
        if (distanceToCamera > maxDistance && !isSelected) {
          return null;
        }

        return (
          <Html key={building.id} position={labelPosition} center>
            <button
              type="button"
              onClick={() => setSelectedBuilding(building)}
              style={{
                border: "none",
                background: isSelected
                  ? "rgba(239, 68, 68, 0.95)"
                  : "rgba(255, 255, 255, 0.96)",
                color: isSelected ? "#ffffff" : "#111827",
                padding: "8px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 700,
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.18)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {building.name}
            </button>
          </Html>
        );
      })}
    </>
  );
}

function BuildingInfoCard() {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );

  if (!selectedBuilding) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        width: "360px",
        background: "rgba(255, 255, 255, 0.96)",
        color: "#111827",
        borderRadius: "16px",
        padding: "18px",
        zIndex: 20,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.18)",
        border: "1px solid rgba(229, 231, 235, 0.9)",
        backdropFilter: "blur(8px)",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#6b7280",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Edificio seleccionado
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "22px",
              lineHeight: 1.2,
              color: "#111827",
            }}
          >
            {selectedBuilding.name}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setSelectedBuilding(null)}
          style={{
            border: "none",
            background: "#f3f4f6",
            color: "#374151",
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: 700,
            lineHeight: 1,
          }}
          aria-label="Cerrar información del edificio"
          title="Cerrar"
        >
          ×
        </button>
      </div>

      <div
        style={{
          display: "inline-block",
          padding: "6px 10px",
          borderRadius: "999px",
          background: "#eff6ff",
          color: "#1d4ed8",
          fontSize: "12px",
          fontWeight: 700,
          marginBottom: "14px",
          textTransform: "capitalize",
        }}
      >
        {selectedBuilding.category}
      </div>

      <div
        style={{
          fontSize: "14px",
          lineHeight: 1.6,
          color: "#374151",
          marginBottom: "16px",
        }}
      >
        {selectedBuilding.description}
      </div>

      <div
        style={{
          display: "grid",
          gap: "10px",
        }}
      >
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: "4px",
              letterSpacing: "0.05em",
            }}
          >
            Código
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {selectedBuilding.code}
          </div>
        </div>

        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: "4px",
              letterSpacing: "0.05em",
            }}
          >
            Nodo 3D
          </div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#111827",
              wordBreak: "break-word",
            }}
          >
            {selectedBuilding.modelNodeName}
          </div>
        </div>
      </div>
    </div>
  );
}

function HoverTooltip({
  hoveredMeshName,
  cursorPosition,
}: {
  hoveredMeshName: string | null;
  cursorPosition: { x: number; y: number } | null;
}) {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);

  const categoryConfig: Record<
    string,
    { label: string; bg: string; text: string }
  > = {
    administrativo: {
      label: "Admin",
      bg: "rgba(59, 130, 246, 0.18)",
      text: "#bfdbfe",
    },
    laboratorio: {
      label: "Lab",
      bg: "rgba(139, 92, 246, 0.18)",
      text: "#ddd6fe",
    },
    biblioteca: {
      label: "Biblioteca",
      bg: "rgba(16, 185, 129, 0.18)",
      text: "#a7f3d0",
    },
    servicio: {
      label: "Servicio",
      bg: "rgba(249, 115, 22, 0.18)",
      text: "#fed7aa",
    },
    aulas: {
      label: "Aulas",
      bg: "rgba(107, 114, 128, 0.18)",
      text: "#e5e7eb",
    },
    otro: {
      label: "Otro",
      bg: "rgba(148, 163, 184, 0.18)",
      text: "#e2e8f0",
    },
  };

  if (!hoveredMeshName || !cursorPosition) {
    return null;
  }

  if (selectedBuilding && selectedBuilding.modelNodeName === hoveredMeshName) {
    return null;
  }

  const matchedBuilding = buildings.find(
    (building) => building.modelNodeName === hoveredMeshName
  );

  const label = matchedBuilding ? matchedBuilding.name : hoveredMeshName;
  const categoryData = matchedBuilding
    ? categoryConfig[matchedBuilding.category]
    : null;

  return (
    <AnimatePresence>
      <motion.div
        key={`${hoveredMeshName}-${cursorPosition.x}-${cursorPosition.y}`}
        initial={{ opacity: 0, y: 6, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.98 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: cursorPosition.y + 14,
          left: cursorPosition.x + 14,
          background: "rgba(17, 24, 39, 0.96)",
          color: "#ffffff",
          padding: "10px 14px",
          borderRadius: "14px",
          zIndex: 9999,
          fontFamily: "Arial, Helvetica, sans-serif",
          boxShadow: "0 12px 28px rgba(0, 0, 0, 0.22)",
          pointerEvents: "none",
          minWidth: "140px",
          maxWidth: "260px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            lineHeight: 1.3,
            marginBottom: categoryData ? "8px" : "0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </div>

        {categoryData && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 8px",
              borderRadius: "999px",
              background: categoryData.bg,
              color: categoryData.text,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {categoryData.label}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function MapLegend() {
  const items = [
    {
      label: "Admin",
      bg: "rgba(59, 130, 246, 0.18)",
      text: "#1d4ed8",
    },
    {
      label: "Lab",
      bg: "rgba(139, 92, 246, 0.18)",
      text: "#7c3aed",
    },
    {
      label: "Biblioteca",
      bg: "rgba(16, 185, 129, 0.18)",
      text: "#059669",
    },
    {
      label: "Servicio",
      bg: "rgba(249, 115, 22, 0.18)",
      text: "#ea580c",
    },
    {
      label: "Aulas",
      bg: "rgba(107, 114, 128, 0.18)",
      text: "#4b5563",
    },
    {
      label: "Otro",
      bg: "rgba(148, 163, 184, 0.18)",
      text: "#475569",
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        right: 20,
        bottom: 20,
        width: "220px",
        background: "rgba(255, 255, 255, 0.96)",
        borderRadius: "16px",
        padding: "16px",
        zIndex: 20,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.16)",
        border: "1px solid rgba(229, 231, 235, 0.9)",
        backdropFilter: "blur(8px)",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#6b7280",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}
      >
        Leyenda del mapa
      </div>

      <div
        style={{
          display: "grid",
          gap: "8px",
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <span
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "999px",
                background: item.bg,
                border: `2px solid ${item.text}`,
                display: "inline-block",
                flexShrink: 0,
              }}
            />

            <span
              style={{
                flex: 1,
                fontSize: "13px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CampusViewer() {
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );
  const [hoveredMeshName, setHoveredMeshName] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  return (
    <div className="viewer-container" style={{ position: "relative" }}>
  <BuildingInfoCard />
  <MapLegend />
  <HoverTooltip
    hoveredMeshName={hoveredMeshName}
    cursorPosition={cursorPosition}
  />

      <Canvas
        shadows
        camera={{ position: [80, 60, 80], fov: 50 }}
        onPointerMissed={() => {
          console.log("No se golpeó ningún mesh");
          setSelectedBuilding(null);
          setHoveredMeshName(null);
          setCursorPosition(null);
        }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[50, 50, 20]} intensity={2} castShadow />
        <gridHelper args={[500, 100]} />
        <CameraFocusController />
        <BuildingLabels />
        <CampusModel
          onSelectName={() => {}}
          onHoverChange={(name, position) => {
            setHoveredMeshName(name);
            setCursorPosition(position ?? null);
          }}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/campus.glb");