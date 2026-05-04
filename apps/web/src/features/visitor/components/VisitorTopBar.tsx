import { UsersIcon, SearchIcon, LogOutIcon, MapIcon } from "../../shared/Icons";

interface VisitorTopBarProps {
  onSearchClick: () => void;
  onLogout: () => void;
}

export function VisitorTopBar({ onSearchClick, onLogout }: VisitorTopBarProps) {
  return (
    <header className="visitor-top-bar">
      <div className="visitor-top-bar__left">
        <div className="visitor-top-bar__logo">
          <MapIcon size={20} />
        </div>
        <div className="visitor-top-bar__info">
          <span className="visitor-top-bar__title">Mapa ITO</span>
          <span className="visitor-top-bar__subtitle">Modo Visitante</span>
        </div>
      </div>

      <div className="visitor-top-bar__actions">
        <button
          className="visitor-top-bar__btn"
          onClick={onSearchClick}
          aria-label="Buscar edificio"
        >
          <SearchIcon size={20} />
        </button>
        <button
          className="visitor-top-bar__btn visitor-top-bar__btn--logout"
          onClick={onLogout}
          aria-label="Salir"
        >
          <LogOutIcon size={20} />
        </button>
      </div>
    </header>
  );
}
