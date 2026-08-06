import { useBuildings } from "../../../hooks/useBuildings";
import { useGates } from "../../../hooks/useGates";
import { BuildingSearch } from "./BuildingSearch";

export function MapSearchOverlay() {
  const { buildings } = useBuildings();
  const { gates } = useGates();

  return (
    <div className="ito-map-search-overlay student-search-panel">
      <BuildingSearch
        buildings={buildings}
        gates={gates}
        inputId="student-desktop-search"
        placeholder="¿Qué estás buscando?"
        ariaLabel="Buscar un destino dentro del campus"
        enableSlashShortcut
      />

    </div>
  );
}
