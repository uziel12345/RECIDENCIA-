import { ChevronLeftIcon, LogOutIcon, SearchIcon } from "../../../components/ui/Icons";
import { ThemeToggle } from "../../../components/ui/ThemeToggle";
import { BuildingSearch } from "../../buildings/components/BuildingSearch";
import { useBuildings } from "../../../hooks/useBuildings";
import { useGates } from "../../../hooks/useGates";

interface VisitorTopBarProps {
  onSearchClick: () => void;
  onLogout: () => void;
  searchOpen: boolean;
  onCloseSearch: () => void;
}

export function VisitorTopBar({
  onSearchClick,
  onLogout,
  searchOpen,
  onCloseSearch,
}: VisitorTopBarProps) {
  const { buildings } = useBuildings();
  const { gates } = useGates();

  if (searchOpen) {
    return (
      <header className="visitor-top-bar visitor-top-bar--search">
        <button
          type="button"
          className="visitor-top-bar__button"
          onClick={onCloseSearch}
          aria-label="Cerrar búsqueda"
          title="Cerrar búsqueda"
        >
          <ChevronLeftIcon size={20} />
        </button>

        <div className="visitor-top-bar__search">
          <BuildingSearch
            buildings={buildings}
            gates={gates}
            onSelectResult={onCloseSearch}
            autoFocus
          />
        </div>
      </header>
    );
  }

  return (
    <header className="visitor-top-bar">
      <div className="visitor-top-bar__brand">
        <div className="visitor-top-bar__brand-icon">
          <img src="/ICONO-TEC.jpeg" alt="" className="visitor-top-bar__logo-img" />
        </div>

        <div className="visitor-top-bar__brand-text">
          <span className="visitor-top-bar__title">Mapa ITO</span>
          <span className="visitor-top-bar__subtitle">Modo visitante</span>
        </div>
      </div>

      <div className="visitor-top-bar__actions">
        <button
          type="button"
          className="visitor-top-bar__button"
          onClick={onSearchClick}
          aria-label="Buscar en el campus"
          title="Buscar en el campus"
        >
          <SearchIcon size={20} />
        </button>
        <ThemeToggle />

        <button
          type="button"
          className="visitor-top-bar__button visitor-top-bar__button--logout"
          onClick={onLogout}
          aria-label="Salir"
          title="Salir"
        >
          <LogOutIcon size={18} />
        </button>
      </div>
    </header>
  );
}
