import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Vector3 } from "three";

export type CameraAnim = { pos: Vector3; look: Vector3; duration?: number };

// Duración fija de la animación en segundos
const DEFAULT_ANIM_DURATION = 1.1;

// Ease-in-out cúbico: empieza lento, acelera a la mitad, frena al final
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function CameraAnimator({
  animRef,
  controlsRef,
}: {
  animRef: { current: CameraAnim | null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: { current: any };
}) {
  const startPosRef  = useRef<Vector3 | null>(null);
  const startLookRef = useRef<Vector3 | null>(null);
  const elapsedRef   = useRef(0);
  const prevAnimRef  = useRef<CameraAnim | null>(null);

  useFrame((state, delta) => {
    const anim = animRef.current;
    const ctrl = controlsRef.current;

    if (!anim || !ctrl) {
      if (ctrl && !ctrl.enabled) ctrl.enabled = true;
      startPosRef.current  = null;
      startLookRef.current = null;
      prevAnimRef.current  = null;
      return;
    }

    state.invalidate();
    ctrl.enabled = false;

    // Nuevo destino o interrupción: capturar posición actual como punto de inicio.
    // Usar referencia al objeto anim (no coordenadas) para detectar cambio de destino
    // aunque la animación esté a mitad — así la cámara siempre arranca desde donde está.
    if (prevAnimRef.current !== anim) {
      startPosRef.current  = ctrl.object.position.clone();
      startLookRef.current = ctrl.target.clone();
      elapsedRef.current   = 0;
      prevAnimRef.current  = anim;
    }

    elapsedRef.current += delta;
    const duration = anim.duration ?? DEFAULT_ANIM_DURATION;
    const t    = Math.min(elapsedRef.current / duration, 1);
    const ease = easeInOutCubic(t);

    ctrl.object.position.lerpVectors(startPosRef.current!, anim.pos, ease);
    ctrl.target.lerpVectors(startLookRef.current!, anim.look, ease);
    ctrl.update();

    if (t >= 1) {
      ctrl.object.position.copy(anim.pos);
      ctrl.target.copy(anim.look);
      ctrl.update();
      ctrl.enabled     = true;
      animRef.current  = null;
      startPosRef.current  = null;
      startLookRef.current = null;
      prevAnimRef.current  = null;
    }
  }, -2); // priority -2: antes de OrbitControls de drei (priority -1)

  return null;
}
