import {
  Canvas,
  type ThreeEvent,
  useFrame,
  useThree,
} from "@react-three/fiber";
import { Html, Line, OrbitControls, useGLTF } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { useBuildingStore } from "../../store/building-store";
import { buildings } from "../../features/buildings/data/buildings";

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(80, 60, 80);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);

type CampusModelProps = {
  onSelectName: (name: string) => void;
  onHoverChange: (
    name: string | null,
    position?: { x: number; y: number }
  ) => void;
};

type CameraMiniMapData = {
  x: number;
  y: number;
  directionX: number;
  directionY: number;
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

function CameraFocusController({
  controlsRef,
  resetSignal,
}: {
  controlsRef: RefObject<{
    target: THREE.Vector3;
    update: () => void;
  } | null>;
  resetSignal: number;
}) {
  const { camera, scene } = useThree();
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);

  const desiredCameraPosition = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);

  const raycaster = useRef(new THREE.Raycaster());
  const tempDirection = useRef(new THREE.Vector3());
  const tempNextCameraPosition = useRef(new THREE.Vector3());
  const collidableMeshes = useRef<THREE.Mesh[]>([]);
  const ignoredMeshes = useRef<Set<THREE.Object3D>>(new Set());

  useEffect(() => {
    const meshes: THREE.Mesh[] = [];

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child);
      }
    });

    collidableMeshes.current = meshes;
  }, [scene]);

  useEffect(() => {
    desiredCameraPosition.current.copy(DEFAULT_CAMERA_POSITION);
    desiredTarget.current.copy(DEFAULT_CAMERA_TARGET);
    ignoredMeshes.current = new Set();
    isAnimating.current = true;
  }, [resetSignal]);

  useEffect(() => {
    if (!selectedBuilding) {
      ignoredMeshes.current = new Set();
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

    const ignored = new Set<THREE.Object3D>();
    selectedObject.traverse((child) => {
      ignored.add(child);
    });
    ignoredMeshes.current = ignored;

    const box = new THREE.Box3().setFromObject(selectedObject);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();

    box.getCenter(center);
    box.getSize(size);

    const maxDimension = Math.max(size.x, size.y, size.z, 1);

    const categoryFocusConfig: Record<
      string,
      { distanceMultiplier: number; min: number; max: number; heightFactor: number }
    > = {
      aulas: {
        distanceMultiplier: 4.8,
        min: 22,
        max: 48,
        heightFactor: 0.72,
      },
      laboratorio: {
        distanceMultiplier: 4.2,
        min: 20,
        max: 42,
        heightFactor: 0.68,
      },
      administrativo: {
        distanceMultiplier: 5.2,
        min: 24,
        max: 50,
        heightFactor: 0.78,
      },
      biblioteca: {
        distanceMultiplier: 5.8,
        min: 26,
        max: 56,
        heightFactor: 0.82,
      },
      servicio: {
        distanceMultiplier: 4.6,
        min: 21,
        max: 44,
        heightFactor: 0.7,
      },
      otro: {
        distanceMultiplier: 4.8,
        min: 22,
        max: 46,
        heightFactor: 0.72,
      },
    };

    const focusConfig =
      categoryFocusConfig[selectedBuilding.category] ??
      categoryFocusConfig.otro;

    const rawDistance = maxDimension * focusConfig.distanceMultiplier;
    const distance = THREE.MathUtils.clamp(
      rawDistance,
      focusConfig.min,
      focusConfig.max
    );

    const elevatedTarget = center.clone();
    elevatedTarget.y += Math.max(size.y * 0.2, 1.5);

    const currentDirection = camera.position.clone().sub(
      controlsRef.current?.target ?? DEFAULT_CAMERA_TARGET
    );

    if (currentDirection.lengthSq() < 0.001) {
      currentDirection.set(1, 0.7, 1);
    }

    currentDirection.normalize();

    desiredTarget.current.copy(elevatedTarget);
    desiredCameraPosition.current.copy(
      elevatedTarget.clone().add(currentDirection.multiplyScalar(distance))
    );

    isAnimating.current = true;
  }, [selectedBuilding, scene, camera, controlsRef]);

  useFrame(() => {
    const currentTarget = controlsRef.current?.target ?? desiredTarget.current;

    const getFilteredHits = (origin: THREE.Vector3, direction: THREE.Vector3) => {
      raycaster.current.set(origin, direction);

      const intersections = raycaster.current.intersectObjects(
        collidableMeshes.current,
        false
      );

      return intersections.filter(
        (hit) => hit.distance > 1 && !ignoredMeshes.current.has(hit.object)
      );
    };

    if (isAnimating.current) {
      tempNextCameraPosition.current.copy(camera.position);
      tempNextCameraPosition.current.lerp(desiredCameraPosition.current, 0.045);

      currentTarget.lerp(desiredTarget.current, 0.045);

      tempDirection.current
        .copy(tempNextCameraPosition.current)
        .sub(currentTarget);

      const intendedDistance = tempDirection.current.length();

      if (intendedDistance > 0.001) {
        tempDirection.current.normalize();

        const intersections = getFilteredHits(currentTarget, tempDirection.current);
        const firstValidHit = intersections[0];

        if (firstValidHit && firstValidHit.distance < intendedDistance) {
          const safeDistance = Math.max(firstValidHit.distance - 2, 8);

          camera.position.copy(
            currentTarget.clone().add(
              tempDirection.current.clone().multiplyScalar(safeDistance)
            )
          );
        } else {
          camera.position.copy(tempNextCameraPosition.current);
        }
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      const cameraDone =
        camera.position.distanceTo(desiredCameraPosition.current) < 1.2;

      const targetDone = currentTarget.distanceTo(desiredTarget.current) < 1.2;

      if (cameraDone && targetDone) {
        isAnimating.current = false;
      }

      return;
    }

    tempDirection.current.copy(camera.position).sub(currentTarget);
    const currentDistance = tempDirection.current.length();

    if (currentDistance <= 0.001) {
      return;
    }

    tempDirection.current.normalize();

    const intersections = getFilteredHits(currentTarget, tempDirection.current);
    const firstValidHit = intersections[0];

    if (firstValidHit && firstValidHit.distance < currentDistance) {
      const safeDistance = Math.max(firstValidHit.distance - 2, 8);

      camera.position.copy(
        currentTarget.clone().add(
          tempDirection.current.clone().multiplyScalar(safeDistance)
        )
      );

      if (controlsRef.current) {
        controlsRef.current.update();
      }
    }
  });

  return null;
}

function SceneControls({
  controlsRef,
}: {
  controlsRef: React.RefObject<{
    target: THREE.Vector3;
    update: () => void;
  } | null>;
}) {
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

function CameraTracker({
  controlsRef,
  onCameraChange,
}: {
  controlsRef: React.RefObject<{
    target: THREE.Vector3;
    update: () => void;
  } | null>;
  onCameraChange: (data: CameraMiniMapData) => void;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const mapX = THREE.MathUtils.clamp(130 + camera.position.x * 1.2, 18, 242);
    const mapY = THREE.MathUtils.clamp(90 + camera.position.z * 1.2, 18, 162);

    const target = controlsRef.current?.target ?? DEFAULT_CAMERA_TARGET;

    const directionWorldX = target.x - camera.position.x;
    const directionWorldZ = target.z - camera.position.z;

    const direction2D = new THREE.Vector2(directionWorldX, directionWorldZ);
    if (direction2D.lengthSq() > 0.0001) {
      direction2D.normalize();
    }

    const arrowLength = 18;

    onCameraChange({
      x: mapX,
      y: mapY,
      directionX: direction2D.x * arrowLength,
      directionY: direction2D.y * arrowLength,
    });
  });

  return null;
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
        const maxDistance = 140;
        const isSelected = selectedBuilding?.id === building.id;

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

function RouteLine() {
  const { scene } = useThree();
  const routeOrigin = useBuildingStore((state) => state.routeOrigin);
  const routeDestination = useBuildingStore((state) => state.routeDestination);

  const routePoints = useMemo(() => {
    if (!routeOrigin || !routeDestination) {
      return null;
    }

    const originObject = scene.getObjectByName(routeOrigin.modelNodeName);
    const destinationObject = scene.getObjectByName(routeDestination.modelNodeName);

    if (!originObject || !destinationObject) {
      return null;
    }

    const originBox = new THREE.Box3().setFromObject(originObject);
    const destinationBox = new THREE.Box3().setFromObject(destinationObject);

    const originCenter = new THREE.Vector3();
    const destinationCenter = new THREE.Vector3();

    originBox.getCenter(originCenter);
    destinationBox.getCenter(destinationCenter);

    originCenter.y += 2;
    destinationCenter.y += 2;

    return [originCenter, destinationCenter];
  }, [routeOrigin, routeDestination, scene]);

  if (!routePoints) {
    return null;
  }

  return <Line points={routePoints} color="#22c55e" lineWidth={4} />;
}

function BuildingInfoCard() {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (selectedBuilding) {
      setIsCollapsed(false);
    }
  }, [selectedBuilding]);

  if (!selectedBuilding) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        width: isCollapsed ? "280px" : "360px",
        background: "rgba(255, 255, 255, 0.96)",
        color: "#111827",
        borderRadius: "16px",
        padding: "18px",
        zIndex: 20,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.18)",
        border: "1px solid rgba(229, 231, 235, 0.9)",
        backdropFilter: "blur(8px)",
        fontFamily: "Arial, Helvetica, sans-serif",
        transition: "width 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: isCollapsed ? "0" : "12px",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
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
              fontSize: isCollapsed ? "18px" : "22px",
              lineHeight: 1.2,
              color: "#111827",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selectedBuilding.name}
          </h2>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
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
            aria-label={isCollapsed ? "Expandir tarjeta" : "Contraer tarjeta"}
            title={isCollapsed ? "Expandir" : "Contraer"}
          >
            {isCollapsed ? "+" : "−"}
          </button>

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
      </div>

      {!isCollapsed && (
        <>
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
        </>
      )}
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
  const [isOpen, setIsOpen] = useState(true);

  const items = [
    { label: "Admin", bg: "rgba(59, 130, 246, 0.18)", text: "#1d4ed8" },
    { label: "Lab", bg: "rgba(139, 92, 246, 0.18)", text: "#7c3aed" },
    { label: "Biblioteca", bg: "rgba(16, 185, 129, 0.18)", text: "#059669" },
    { label: "Servicio", bg: "rgba(249, 115, 22, 0.18)", text: "#ea580c" },
    { label: "Aulas", bg: "rgba(107, 114, 128, 0.18)", text: "#4b5563" },
    { label: "Otro", bg: "rgba(148, 163, 184, 0.18)", text: "#475569" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        right: 20,
        bottom: 20,
        width: isOpen ? "220px" : "auto",
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#6b7280",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Leyenda del mapa
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            border: "none",
            background: "#f3f4f6",
            color: "#374151",
            minWidth: "34px",
            height: "34px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {isOpen ? "−" : "+"}
        </button>
      </div>

      {isOpen && (
        <div
          style={{
            display: "grid",
            gap: "8px",
            marginTop: "12px",
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
      )}
    </div>
  );
}

function ResetCameraButton({ onReset }: { onReset: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 20,
        top: 20,
        zIndex: 20,
      }}
    >
      <button
        type="button"
        onClick={onReset}
        style={{
          border: "none",
          background: "rgba(255, 255, 255, 0.96)",
          color: "#111827",
          padding: "12px 16px",
          borderRadius: "14px",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 700,
          boxShadow: "0 12px 30px rgba(0, 0, 0, 0.16)",
        }}
        title="Volver a la vista general"
      >
        Vista general
      </button>
    </div>
  );
}

function MiniMap2D({
  cameraMarker,
}: {
  cameraMarker: CameraMiniMapData;
}) {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );
  const [isOpen, setIsOpen] = useState(true);

  const points = [
    { id: "ed-direccion", label: "DIR", x: 70, y: 55 },
    { id: "ed-biblioteca", label: "BIB", x: 105, y: 78 },
    { id: "ed-centro-computo", label: "CC", x: 132, y: 96 },
    { id: "ed-edificio-h", label: "H", x: 165, y: 118 },
    { id: "ed-edificio-i", label: "I", x: 195, y: 138 },
    { id: "ed-edificio-j", label: "J", x: 224, y: 158 },
  ];

  const arrowEndX = cameraMarker.x + cameraMarker.directionX;
  const arrowEndY = cameraMarker.y + cameraMarker.directionY;

  return (
    <div
      style={{
        position: "absolute",
        left: 20,
        bottom: 20,
        width: isOpen ? "280px" : "auto",
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#6b7280",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Mini mapa 2D
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            border: "none",
            background: "#f3f4f6",
            color: "#374151",
            minWidth: "34px",
            height: "34px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: 700,
            lineHeight: 1,
          }}
          title={isOpen ? "Contraer" : "Expandir"}
        >
          {isOpen ? "−" : "+"}
        </button>
      </div>

      {isOpen && (
        <div style={{ marginTop: "12px" }}>
          <svg
            viewBox="0 0 260 180"
            width="100%"
            height="180"
            style={{
              display: "block",
              borderRadius: "12px",
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
            }}
          >
            <defs>
              <marker
                id="camera-arrowhead"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 6 3, 0 6" fill="#f59e0b" />
              </marker>
            </defs>

            <rect x="12" y="12" width="236" height="156" rx="12" fill="#eef2f7" />
            <path
              d="M30 145 L75 120 L118 100 L155 80 L195 56 L228 34"
              stroke="#94a3b8"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />

            {points.map((point) => {
              const building = buildings.find((item) => item.id === point.id);
              const isSelected = selectedBuilding?.id === point.id;

              return (
                <g
                  key={point.id}
                  onClick={() => {
                    if (building) {
                      setSelectedBuilding(building);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isSelected ? 9 : 7}
                    fill={isSelected ? "#ef4444" : "#2563eb"}
                    stroke="#ffffff"
                    strokeWidth="3"
                  />
                  <text
                    x={point.x}
                    y={point.y - 12}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#111827"
                  >
                    {point.label}
                  </text>
                </g>
              );
            })}

            <line
              x1={cameraMarker.x}
              y1={cameraMarker.y}
              x2={arrowEndX}
              y2={arrowEndY}
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
              markerEnd="url(#camera-arrowhead)"
            />

            <circle
              cx={cameraMarker.x}
              cy={cameraMarker.y}
              r="6"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle
              cx={cameraMarker.x}
              cy={cameraMarker.y}
              r="12"
              fill="none"
              stroke="rgba(245, 158, 11, 0.35)"
              strokeWidth="2"
            />
          </svg>

          <div
            style={{
              marginTop: "10px",
              fontSize: "12px",
              color: "#6b7280",
              lineHeight: 1.5,
            }}
          >
            Punto naranja, posición aproximada de la cámara. Flecha naranja,
            dirección aproximada de la vista actual.
          </div>
        </div>
      )}
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
  const [resetSignal, setResetSignal] = useState(0);
  const [cameraMarker, setCameraMarker] = useState<CameraMiniMapData>({
    x: 130,
    y: 90,
    directionX: 14,
    directionY: 14,
  });

  const controlsRef = useRef<{
    target: THREE.Vector3;
    update: () => void;
  } | null>(null);

  const handleResetCamera = () => {
    setSelectedBuilding(null);
    setHoveredMeshName(null);
    setCursorPosition(null);
    setResetSignal((prev) => prev + 1);
  };

  return (
    <div className="viewer-container" style={{ position: "relative" }}>
      <BuildingInfoCard />
      <MapLegend />
      <MiniMap2D cameraMarker={cameraMarker} />
      <ResetCameraButton onReset={handleResetCamera} />
      <HoverTooltip
        hoveredMeshName={hoveredMeshName}
        cursorPosition={cursorPosition}
      />

      <Canvas
        shadows
        camera={{ position: [80, 60, 80], fov: 50 }}
        onPointerMissed={() => {
          setSelectedBuilding(null);
          setHoveredMeshName(null);
          setCursorPosition(null);
        }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[50, 50, 20]} intensity={2} castShadow />
        <gridHelper args={[500, 100]} />
        <SceneControls controlsRef={controlsRef} />
        <CameraFocusController
          controlsRef={controlsRef}
          resetSignal={resetSignal}
        />
        <CameraTracker
          controlsRef={controlsRef}
          onCameraChange={setCameraMarker}
        />
        <BuildingLabels />
        <RouteLine />
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