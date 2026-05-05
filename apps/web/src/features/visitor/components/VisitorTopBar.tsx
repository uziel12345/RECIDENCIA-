import { SearchIcon, LogOutIcon, MapIcon } from "../../shared/Icons";

interface VisitorTopBarProps {
  onSearchClick: () => void;
  onLogout: () => void;
}

export function VisitorTopBar({ onSearchClick, onLogout }: VisitorTopBarProps) {
  return (
    <header className="visitor-top-bar">
      <div className="visitor-top-bar__brand">
        <div className="visitor-top-bar__brand-icon">
          <MapIcon size={20} />
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
          aria-label="Buscar edificio"
          title="Buscar edificio"
        >
          <SearchIcon size={18} />
        </button>

        <button
          type="button"
          className="visitor-top-bar__button"
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