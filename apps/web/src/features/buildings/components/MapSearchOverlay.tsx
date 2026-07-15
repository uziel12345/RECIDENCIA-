import { useState } from "react";
import { useBuildingStore } from "../../../store/building-store";
import { useBuildings } from "../../../hooks/useBuildings";
import { useGates } from "../../../hooks/useGates";
import { BuildingSearch } from "./BuildingSearch";

type MapSearchOverlayProps = {
  userName?: string;
};

export function MapSearchOverlay({ userName }: MapSearchOverlayProps) {
  const { buildings } = useBuildings();
  const { gates } = useGates();
  const searchTerm = useBuildingStore((state) => state.searchTerm);

  // Colapsada por defecto: solo el buscador, para no tapar el mapa/etiquetas.
  // Se expande (saludo) al enfocar el buscador o mientras haya un término
  // de búsqueda escrito.
  const [isFocused, setIsFocused] = useState(false);
  const isExpanded = isFocused || searchTerm.trim().length > 0;

  return (
    <div
      className="ito-map-search-overlay flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-[var(--shadow-lg)]"
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsFocused(false);
        }
      }}
    >
      {isExpanded && (
        <div className="flex flex-col gap-1 px-0.5">
          <span className="text-balance text-[15px] font-bold leading-tight tracking-tight text-[var(--color-text)]">
            {userName
              ? `¿A dónde vas hoy, ${userName.split(" ")[0]}?`
              : "¿A dónde quieres ir hoy?"}
          </span>
          <span className="text-[12px] font-medium text-[var(--color-text-muted)]">
            Busca aulas, servicios, laboratorios y más
          </span>
        </div>
      )}

      <BuildingSearch buildings={buildings} gates={gates} />
    </div>
  );
}
