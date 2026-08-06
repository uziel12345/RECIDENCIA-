import { ChevronLeftIcon, LogOutIcon, SearchIcon } from "../../../components/ui/Icons";
import { ThemeToggle } from "../../../components/ui/ThemeToggle";
import { BuildingSearch } from "../../buildings/components/BuildingSearch";
import { useBuildings } from "../../../hooks/useBuildings";
import { useGates } from "../../../hooks/useGates";

interface StudentTopBarProps {
  userName: string;
  onSearchClick: () => void;
  onLogout: () => void;
  searchOpen: boolean;
  onCloseSearch: () => void;
}

export function StudentTopBar({
  userName,
  onSearchClick,
  onLogout,
  searchOpen,
  onCloseSearch,
}: StudentTopBarProps) {
  const { buildings } = useBuildings();
  const { gates } = useGates();

  if (searchOpen) {
    return (
      <header className="student-top-bar student-top-bar--search">
        <label className="student-top-bar__search-title" htmlFor="student-mobile-search">
          Buscar en el campus
        </label>

        <div className="student-top-bar__search-row">
          <button
            type="button"
            className="student-top-bar__btn"
            onClick={onCloseSearch}
            aria-label="Cerrar búsqueda"
            title="Cerrar búsqueda"
          >
            <ChevronLeftIcon size={20} />
          </button>

          <div className="student-top-bar__search">
            <BuildingSearch
              buildings={buildings}
              gates={gates}
              onSelectResult={onCloseSearch}
              inputId="student-mobile-search"
              placeholder="¿Qué estás buscando?"
              ariaLabel="Buscar un destino dentro del campus"
              autoFocus
            />
          </div>
        </div>

      </header>
    );
  }

  return (
    <header className="student-top-bar">
      <div className="student-top-bar__primary-row">
        <div className="student-top-bar__left">
          <div className="student-top-bar__avatar">
            <img src="/ICONO-TEC.jpeg" alt="" className="student-top-bar__logo" />
          </div>
          <div className="student-top-bar__info">
            <span className="student-top-bar__greeting">Hola,</span>
            <span className="student-top-bar__name">{userName}</span>
          </div>
        </div>

        <div className="student-top-bar__actions">
          <ThemeToggle />
          <button
            type="button"
            className="student-top-bar__btn student-top-bar__btn--logout"
            onClick={onLogout}
            aria-label="Cerrar sesión"
          >
            <LogOutIcon size={20} />
          </button>
        </div>
      </div>

      <button
        type="button"
        className="student-top-bar__search-trigger"
        onClick={onSearchClick}
        aria-label="Buscar edificio, aula o servicio"
      >
        <SearchIcon size={19} aria-hidden="true" />
        <span>Buscar edificio, aula o servicio</span>
      </button>
    </header>
  );
}
