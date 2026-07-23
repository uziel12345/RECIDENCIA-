import { Icon, type IconName } from "../../../components/ui/Icons";
import type { CSSProperties } from "react";

type Action = {
  id: string;
  label: string;
  icon: IconName;
  onClick: () => void;
  active?: boolean;
  badge?: string | number;
  primary?: boolean;
  disabled?: boolean;
};

type MobileQuickActionsProps = {
  actions: Action[];
};

function getButtonClassName(action: Action) {
  const classes = ["ito-mobile-bar__btn"];

  if (action.primary) {
    classes.push("ito-mobile-bar__btn--primary");
  }

  if (action.active) {
    classes.push("is-active");
  }

  if (action.disabled) {
    classes.push("is-disabled");
  }

  return classes.join(" ");
}

export function MobileQuickActions({ actions }: MobileQuickActionsProps) {
  return (
    <nav className="ito-mobile-bar" aria-label="Navegación rápida móvil">
      <div
        className="ito-mobile-bar__inner"
        style={{ "--mobile-action-count": actions.length } as CSSProperties}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={getButtonClassName(action)}
            aria-pressed={action.active}
            aria-label={`${action.active ? "Cerrar" : "Abrir"} ${action.label}`}
            title={`${action.active ? "Cerrar" : "Abrir"} ${action.label}`}
          >
            <span className="ito-mobile-bar__btn-icon" aria-hidden="true">
              <Icon name={action.icon} size={action.primary ? 22 : 19} />

              {action.badge !== undefined && action.badge !== null && (
                <span className="ito-mobile-bar__badge">{action.badge}</span>
              )}
            </span>

            <span className="ito-mobile-bar__btn-label">{action.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
