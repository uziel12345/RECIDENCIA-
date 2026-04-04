import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useBuildingStore } from "../../store/building-store";
import { buildings } from "../../features/buildings/data/buildings";

type CampusModelProps = {
  onSelectName: (name: string) => void;
};

function CampusModel({ onSelectName }: CampusModelProps) {
  const { scene } = useGLTF("/models/campus.glb");

  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);
  const setSelectedBuilding = useBuildingStore(
    (state) => state.setSelectedBuilding
  );

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
      if (child instanceof THREE.Mesh) {
        const material = child.material;

        const isSelected =
          selectedBuilding !== null &&
          child.name === selectedBuilding.modelNodeName;

        if (Array.isArray(material)) {
          material.forEach((mat) => {
            if ("color" in mat) {
              (mat as THREE.MeshStandardMaterial).color.set(
                isSelected ? "red" : "#cccccc"
              );
            }
          });
        } else if ("color" in material) {
          (material as THREE.MeshStandardMaterial).color.set(
            isSelected ? "red" : "#cccccc"
          );
        }
      }
    });
  }, [selectedBuilding, model]);

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
    }
  };

  return <primitive object={model} onPointerDown={handlePointerDown} />;
}

export function CampusViewer() {
  const selectedBuilding = useBuildingStore((state) => state.selectedBuilding);

  return (
    <div className="viewer-container" style={{ position: "relative" }}>
      {selectedBuilding && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            maxWidth: "340px",
            padding: "14px 16px",
            background: "rgba(0, 0, 0, 0.78)",
            color: "#ffffff",
            borderRadius: "10px",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "14px",
            zIndex: 10,
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.18)",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            {selectedBuilding.name}
          </div>

          <div style={{ marginBottom: "6px", opacity: 0.9 }}>
            <strong>Categoría:</strong> {selectedBuilding.category}
          </div>

          <div style={{ lineHeight: 1.5, marginBottom: "8px" }}>
            {selectedBuilding.description}
          </div>

          <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.8 }}>
            <strong>Nodo 3D:</strong> {selectedBuilding.modelNodeName}
          </div>
        </div>
      )}

      <Canvas
        shadows
        camera={{ position: [80, 60, 80], fov: 50 }}
        onPointerMissed={() => {
          console.log("No se golpeó ningún mesh");
        }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[50, 50, 20]} intensity={2} castShadow />
        <gridHelper args={[500, 100]} />
        <OrbitControls />
        <CampusModel onSelectName={() => {}} />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/campus.glb");