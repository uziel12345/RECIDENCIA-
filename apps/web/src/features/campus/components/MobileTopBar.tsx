import { Icon } from "../../../components/ui/Icons";

type MobileTopBarProps = {
  totalBuildings: number;
  hasLocation: boolean;
  onSearchClick: () => void;
};

export function MobileTopBar({
  totalBuildings,
  hasLocation,
  onSearchClick,
}: MobileTopBarProps) {
  return (
    <header className="ito-mobile-top">
      <button
        type="button"
        onClick={onSearchClick}
        className="ito-mobile-top__brand"
        aria-label="Abrir búsqueda"
      >
        <span className="ito-mobile-top__mark" aria-hidden="true">
          <img src="/ICONO-TEC.jpeg" alt="" className="ito-mobile-top__logo" />
        </span>
        <span className="ito-mobile-top__text">
          <span className="ito-mobile-top__title">Campus ITO</span>
          <span className="ito-mobile-top__subtitle">
            {totalBuildings > 0
              ? `${totalBuildings} edificios`
              : "Cargando…"}
            {hasLocation && (
              <>
                <span className="ito-mobile-top__sep" aria-hidden="true">
                  •
                </span>
                <span className="ito-mobile-top__live">
                  <span
                    className="ito-mobile-top__live-dot"
                    aria-hidden="true"
                  />
                  En vivo
                </span>
              </>
            )}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onSearchClick}
        className="ito-mobile-top__search"
        aria-label="Buscar edificios"
      >
        <Icon name="search" size={18} />
      </button>
    </header>
  );
}
