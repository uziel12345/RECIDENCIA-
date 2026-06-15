import { SearchIcon, LogOutIcon } from "../../../components/ui/Icons";

interface VisitorTopBarProps {
  onSearchClick: () => void;
  onLogout: () => void;
}

export function VisitorTopBar({ onSearchClick, onLogout }: VisitorTopBarProps) {
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
          className="visitor-top-bar__button visitor-top-bar__button--search"
          onClick={onSearchClick}
          aria-label="Buscar edificio"
          title="Buscar edificio"
        >
          <SearchIcon size={18} />
        </button>

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
