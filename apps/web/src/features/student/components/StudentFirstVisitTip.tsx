import { Icon, type IconName } from "../../../components/ui/Icons";

type TipItem = {
  icon: IconName;
  label: string;
  desc: string;
};

const ITEMS: TipItem[] = [
  { icon: "home", label: "Inicio", desc: "Busca edificios, aulas y traza tu ruta" },
  { icon: "info", label: "Servicios", desc: "Control escolar, biblioteca, cafetería y más" },
  { icon: "clock", label: "Horario", desc: "Consulta tus clases del día" },
];

type StudentFirstVisitTipProps = {
  isMobile: boolean;
  onDismiss: () => void;
};

export function StudentFirstVisitTip({ isMobile, onDismiss }: StudentFirstVisitTipProps) {
  return (
    <div
      className={`ito-first-visit-tip${isMobile ? " ito-first-visit-tip--mobile" : ""}`}
      role="note"
      aria-label="Guía rápida de la aplicación"
    >
      <div className="ito-first-visit-tip__header">
        <span className="ito-first-visit-tip__title">¡Bienvenido a tu mapa del campus!</span>
        <button
          type="button"
          className="ito-first-visit-tip__close"
          onClick={onDismiss}
          aria-label="Cerrar guía"
        >
          <Icon name="close" size={13} />
        </button>
      </div>

      <div className="ito-first-visit-tip__list">
        {ITEMS.map((item) => (
          <div key={item.label} className="ito-first-visit-tip__row">
            <span className="ito-first-visit-tip__row-icon" aria-hidden="true">
              <Icon name={item.icon} size={13} />
            </span>
            <span className="ito-first-visit-tip__row-text">
              <strong>{item.label}:</strong> {item.desc}
            </span>
          </div>
        ))}
      </div>

      <button type="button" className="ito-first-visit-tip__cta" onClick={onDismiss}>
        Entendido, ¡vamos!
      </button>
    </div>
  );
}
