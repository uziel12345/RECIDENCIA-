import { useEffect, useState } from "react";

const FLASH_MS = 2500;

/**
 * Cuando `highlightId` cambia a un id no vacío: hace scroll al elemento con
 * id DOM `search-target-<highlightId>` y devuelve ese id durante FLASH_MS
 * para que el llamador le aplique un resaltado visual temporal.
 */
export function useHighlightFlash(highlightId?: string): string | null {
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFlashId(highlightId);
    document
      .getElementById(`search-target-${highlightId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });

    const timer = setTimeout(() => setFlashId(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [highlightId]);

  return flashId;
}

export const HIGHLIGHT_FLASH_CLASS =
  "ring-2 ring-[color:var(--ring-brand)] bg-[var(--color-brand-50)]";
