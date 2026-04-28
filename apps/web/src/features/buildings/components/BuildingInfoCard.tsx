import { useBuildingStore } from "../../../store/building-store";
import { CategoryBadge, getCategoryAccent } from "../../../components/ui/CategoryBadge";
import { Icon } from "../../../components/ui/Icons";
import type { Building } from "../types/building";

type BuildingInfoCardProps = {
  building: Building;
};

export function BuildingInfoCard({ building }: BuildingInfoCardProps) {
  const setSelectedBuilding = useBuildingStore((s) => s.setSelectedBuilding);
  const setRouteDestination = useBuildingStore((s) => s.setRouteDestination);
  const accent = getCategoryAccent(building.category_name);

  return (
    <article className="ito-info-card" aria-label={`Información de ${building.name}`}>
      <div
        className="ito-info-card__hero"
        style={{
          background: `linear-gradient(135deg, ${accent.fg} 0%, ${accent.fgDark} 100%)`,
        }}
      >
        <div className="ito-info-card__hero-icon" aria-hidden="true">
          <Icon name="building" size={26} />
        </div>
        <div className="ito-info-card__hero-text">
          <div className="ito-info-card__code">Edificio {building.code}</div>
          <h3 className="ito-info-card__name">{building.name}</h3>
        </div>
        <button
          type="button"
          className="ito-info-card__close"
          onClick={() => setSelectedBuilding(null)}
          aria-label="Cerrar información"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="ito-info-card__body">
        <div className="ito-info-card__row">
          <span className="ito-info-card__label">Categoría</span>
          <CategoryBadge name={building.category_name} />
        </div>

        {building.description ? (
          <div className="ito-info-card__row ito-info-card__row--block">
            <span className="ito-info-card__label">Descripción</span>
            <p className="ito-info-card__text">{building.description}</p>
          </div>
        ) : (
          <div className="ito-info-card__row ito-info-card__row--block">
            <span className="ito-info-card__label">Descripción</span>
            <p className="ito-info-card__text ito-info-card__text--muted">
              Sin descripción disponible.
            </p>
          </div>
        )}

        <div className="ito-info-card__actions">
          <button
            type="button"
            className="ito-btn ito-btn--primary"
            onClick={() => setRouteDestination(building)}
          >
            <Icon name="route" size={16} />
            <span>Trazar ruta aquí</span>
          </button>
        </div>
      </div>
    </article>
  );
}
