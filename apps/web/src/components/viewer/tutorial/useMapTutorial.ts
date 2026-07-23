import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ito_map_tutorial_completed_v1";

function readCompleted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCompleted() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // localStorage puede fallar en modo privado — no es crítico, el
    // tutorial solo volvería a aparecer en la siguiente visita.
  }
}

/**
 * Controla cuándo se muestra el tutorial de controles del mapa: automático
 * la primera vez (persistido en localStorage) y reabrible en cualquier
 * momento desde el botón de ayuda del toolbar.
 */
export function useMapTutorial(autoShow: boolean) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (autoShow && !readCompleted()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true);
    }
  }, [autoShow]);

  const close = useCallback(() => {
    writeCompleted();
    setIsOpen(false);
  }, []);

  const reopen = useCallback(() => {
    setIsOpen(true);
  }, []);

  return { isOpen, close, reopen };
}
