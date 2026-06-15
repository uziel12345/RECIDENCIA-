import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";

export const MODEL_PATH = "/models/campus.glb";

export function CampusModel() {
  const { scene } = useGLTF(MODEL_PATH);

  useMemo(() => {
    scene.traverse((child) => {
      if (child.name.startsWith("NavMesh")) child.visible = false;
    });
  }, [scene]);

  return <primitive object={scene} />;
}
