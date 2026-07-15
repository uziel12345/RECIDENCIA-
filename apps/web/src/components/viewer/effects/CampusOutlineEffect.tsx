import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector2 } from "three";
import { EffectComposer, RenderPass } from "three-stdlib";
import { SketchOutlinePass } from "./SketchOutlinePass";

type CampusOutlineEffectProps = {
  /** Downscala solo el pase de contorno (normal+profundidad extra), no el
   *  color base — en móvil evita que ese render extra de la escena pese
   *  tanto como el principal. 1 = misma resolución que el canvas. */
  resolutionScale?: number;
};

// Sustituye el render por defecto del <Canvas> (frameloop="demand") por un
// EffectComposer de 2 pases: color normal + contorno tipo SketchUp
// (SketchOutlinePass). El priority>0 en useFrame hace que R3F deje de
// llamar a su propio gl.render() y ceda el frame a este composer — sigue
// respetando el modelo "solo renderiza on-demand", no fuerza modo continuo.
export function CampusOutlineEffect({ resolutionScale = 1 }: CampusOutlineEffectProps) {
  const { gl, scene, camera, size, invalidate } = useThree();

  const composer = useMemo(() => {
    const instance = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    const outlinePass = new SketchOutlinePass(scene, camera, new Vector2(1, 1), resolutionScale);
    instance.addPass(renderPass);
    instance.addPass(outlinePass);
    return instance;
  }, [gl, scene, camera, resolutionScale]);

  useEffect(() => {
    return () => {
      composer.passes.forEach((pass) => pass.dispose());
      composer.dispose();
    };
  }, [composer]);

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
    invalidate();
  }, [composer, gl, size, invalidate]);

  useFrame(() => {
    composer.render();
  }, 1);

  return null;
}
