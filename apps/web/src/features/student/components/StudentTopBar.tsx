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
            autoFocus
          />
        </div>
      </header>
    );
  }

  return (
    <header className="student-top-bar">
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
        <button
          type="button"
          className="student-top-bar__btn"
          onClick={onSearchClick}
          aria-label="Buscar en el campus"
          title="Buscar en el campus"
        >
          <SearchIcon size={21} />
        </button>
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
    </header>
  );
}
