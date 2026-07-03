import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh } from "three";
import type { Material } from "three";

export const MODEL_PATH = "/models/campus.glb";

export function CampusModel() {
  const { scene } = useGLTF(MODEL_PATH);

  useMemo(() => {
    scene.traverse((child) => {
      if (child.name.startsWith("NavMesh")) {
        child.visible = false;
        return;
      }

      if (!(child instanceof Mesh)) return;

      const mats: Material[] = Array.isArray(child.material)
        ? child.material
        : [child.material];

      for (const mat of mats) {
        if (!mat) continue;
        mat.dithering = true;
        mat.needsUpdate = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}
