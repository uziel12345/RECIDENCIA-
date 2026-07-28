import { useEffect, useState } from "react";
import { CampusViewer } from "./CampusViewer";
import type { GatePlacementPosition } from "./GatePlacementLayer";
import { useIsMobile } from "../../hooks/useIsMobile";

type GateLocationPickerModalProps = {
  initialPosition: GatePlacementPosition | null;
  onConfirm: (position: GatePlacementPosition) => void;
  onClose: () => void;
};

export function GateLocationPickerModal({
  initialPosition,
  onConfirm,
  onClose,
}: GateLocationPickerModalProps) {
  const [position, setPosition] = useState<GatePlacementPosition | null>(initialPosition);
  const isMobile = useIsMobile();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-location-picker-title"
      className="fixed inset-0 z-[100] flex flex-col bg-[#020617]/95 backdrop-blur-sm"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#334155] bg-[#0f172a] px-5 py-3.5 max-[640px]:px-3.5">
        <div>
          <h2 id="gate-location-picker-title" className="m-0 text-[17px] font-bold text-[#f8fafc]">
            Ubicar puerta en el mapa
          </h2>
          <p className="m-0 mt-1 text-[12.5px] text-[#94a3b8]">
            Acerca y gira el mapa; después pulsa exactamente sobre la entrada del campus.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {position && (
            <span className="rounded-lg border border-[#c15a3e]/30 bg-[#c15a3e]/10 px-3 py-2 text-xs font-semibold text-[#eab8a3]">
              X {position.x.toFixed(2)} · Z {position.z.toFixed(2)}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-lg border border-[#334155] bg-transparent px-3 text-[13px] font-semibold text-[#cbd5e1] hover:bg-[#1e293b]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!position}
            onClick={() => position && onConfirm(position)}
            className="min-h-10 rounded-lg border border-[#c15a3e]/40 bg-[#a8442e] px-4 text-[13px] font-bold text-white hover:bg-[#833323] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Usar ubicación
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 cursor-crosshair">
        <CampusViewer
          isMobile={isMobile}
          mobilePanelOpen={false}
          hideCategoryLegend
          gatePlacementPosition={position}
          onGatePlacementChange={setPosition}
        />
        {!position && (
          <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-[#0f172a]/90 px-4 py-2 text-center text-[12px] font-semibold text-white shadow-xl">
            Pulsa sobre el suelo para colocar el marcador
          </div>
        )}
      </div>
    </div>
  );
}
