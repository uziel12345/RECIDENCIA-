import { useCallback, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";

// Si el puntero se movió más que esto (en píxeles de pantalla) entre
// pointerdown y click, fue un arrastre para rotar/mover el mapa — no un
// clic real sobre el objeto. Sin este filtro, soltar el clic encima de un
// edificio/puerta después de orbitar la cámara lo selecciona por accidente.
const MOUSE_DRAG_THRESHOLD_PX = 5;
// Un dedo tiene más variación natural que un mouse incluso durante un tap.
// Darle un poco más de tolerancia evita perder selecciones válidas, sin
// convertir un arrastre intencional del mapa en un toque.
const TOUCH_DRAG_THRESHOLD_PX = 12;

type PointerDownPos = {
  x: number;
  y: number;
  pointerType: string;
} | null;

function exceedsDragThreshold(
  downPos: PointerDownPos,
  event: { clientX: number; clientY: number }
): boolean {
  if (!downPos) return false;
  const dx = event.clientX - downPos.x;
  const dy = event.clientY - downPos.y;
  const threshold =
    downPos.pointerType === "touch"
      ? TOUCH_DRAG_THRESHOLD_PX
      : MOUSE_DRAG_THRESHOLD_PX;
  return Math.sqrt(dx * dx + dy * dy) > threshold;
}

/** Para un único objeto clickeable (un mesh, un marcador). */
export function useDragAwareClick(onRealClick: (event: ThreeEvent<MouseEvent>) => void) {
  const pointerDownPosRef = useRef<PointerDownPos>(null);

  const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    pointerDownPosRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerType: event.pointerType,
    };
  }, []);

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (exceedsDragThreshold(pointerDownPosRef.current, event)) return;
      onRealClick(event);
    },
    [onRealClick]
  );

  return { handlePointerDown, handleClick };
}

/**
 * Para listas de objetos clickeables que comparten el mismo lienzo (ej. N
 * cajas invisibles de hitbox, una por edificio, dentro de un .map()) — un
 * solo ref de pointerdown a nivel del componente padre, y una función pura
 * (`wasDrag`) para usar dentro del onClick de cada elemento sin violar las
 * reglas de hooks dentro de un .map().
 */
export function useSharedPointerDownTracker() {
  const pointerDownPosRef = useRef<PointerDownPos>(null);

  const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    pointerDownPosRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerType: event.pointerType,
    };
  }, []);

  const wasDrag = useCallback((event: ThreeEvent<MouseEvent>) => {
    return exceedsDragThreshold(pointerDownPosRef.current, event);
  }, []);

  return { handlePointerDown, wasDrag };
}
