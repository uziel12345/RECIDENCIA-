import { useBuildingStore } from "../../../store/building-store";
import { Icon } from "../../../components/ui/Icons";

export function BuildingSearch() {
  const searchTerm = useBuildingStore((state) => state.searchTerm);
  const setSearchTerm = useBuildingStore((state) => state.setSearchTerm);

  return (
    <div className="ito-search">
      <span className="ito-search__icon">
        <Icon name="search" size={18} />
      </span>

      <input
        id="building-search"
        type="search"
        className="ito-search__input"
        placeholder="Buscar edificio, código o categoría…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Buscar edificio"
        autoComplete="off"
      />

      {searchTerm.trim() && (
        <button
          type="button"
          className="ito-search__clear"
          onClick={() => setSearchTerm("")}
          aria-label="Limpiar búsqueda"
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
}
