import { GraduationCapIcon, SearchIcon, LogOutIcon } from "../../../components/ui/Icons";

interface StudentTopBarProps {
  userName: string;
  onSearchClick: () => void;
  onLogout: () => void;
}

export function StudentTopBar({ userName, onSearchClick, onLogout }: StudentTopBarProps) {
  return (
    <header className="student-top-bar">
      <div className="student-top-bar__left">
        <div className="student-top-bar__avatar">
          <GraduationCapIcon size={18} />
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
          aria-label="Buscar edificio"
        >
          <SearchIcon size={20} />
        </button>
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
