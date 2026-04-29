import { Icon, type IconName } from "../../../components/ui/Icons";

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

export function MobileQuickActions({ actions }: MobileQuickActionsProps) {
  return (
    <nav className="ito-mobile-bar" aria-label="Acciones rápidas">
      <div className="ito-mobile-bar__inner">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={`ito-mobile-bar__btn${
              action.primary ? " ito-mobile-bar__btn--primary" : ""
            }${action.active ? " is-active" : ""}`}
            aria-pressed={action.active}
            aria-label={action.label}
          >
            <span className="ito-mobile-bar__btn-icon" aria-hidden="true">
              <Icon name={action.icon} size={action.primary ? 20 : 18} />
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
