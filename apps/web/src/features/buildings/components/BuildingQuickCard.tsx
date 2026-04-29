import { motion } from "framer-motion";
import { useBuildingStore } from "../../../store/building-store";
import { useLocationStore } from "../../../store/location-store";
import { getCategoryAccent } from "../../../components/ui/CategoryBadge";
import { Icon } from "../../../components/ui/Icons";
import type { Building } from "../types/building";

type BuildingQuickCardProps = {
  building: Building;
  onOpenDetails: () => void;
};

export function BuildingQuickCard({
  building,
  onOpenDetails,
}: BuildingQuickCardProps) {
  const setRouteDestination = useBuildingStore((s) => s.setRouteDestination);
  const setSelectedBuilding = useBuildingStore((s) => s.setSelectedBuilding);
  const permission = useLocationStore((s) => s.permission);
  const mapPosition = useLocationStore((s) => s.mapPosition);

  const accent = getCategoryAccent(building.category_name);
  const accentColor = building.category_color || accent.fg;

  const canRoute = permission === "granted" && mapPosition !== null;

  return (
    <motion.div
      key={building.id}
      initial={{ y: 24, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 24, opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="ito-quick-card"
      role="dialog"
      aria-label={`Acciones rápidas para ${building.name}`}
    >
      <div className="ito-quick-card__rail" style={{ background: accentColor }} />

      <div className="ito-quick-card__main">
        <div className="ito-quick-card__head">
          <div className="ito-quick-card__head-text">
            <span
              className="ito-quick-card__chip"
              style={{
                background: accent.bg,
                color: accent.fg,
                borderColor: accent.border,
              }}
            >
              <span
                className="ito-quick-card__chip-dot"
                style={{ background: accentColor }}
                aria-hidden="true"
              />
              {building.category_name}
            </span>
            <div className="ito-quick-card__code">EDIFICIO {building.code}</div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedBuilding(null)}
            className="ito-quick-card__close"
            aria-label="Cerrar tarjeta"
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        <h3 className="ito-quick-card__title">{building.name}</h3>

        <div className="ito-quick-card__actions">
          <button
            type="button"
            onClick={onOpenDetails}
            className="ito-quick-action ito-quick-action--ghost"
          >
            <Icon name="info" size={16} />
            <span>Detalles</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!canRoute) {
                onOpenDetails();
                return;
              }
              setRouteDestination(building);
            }}
            className="ito-quick-action ito-quick-action--primary"
            style={{ background: accentColor, borderColor: accentColor }}
          >
            <Icon name="route" size={16} />
            <span>{canRoute ? "Trazar ruta" : "Ver ruta"}</span>
            <Icon name="arrow-right" size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
