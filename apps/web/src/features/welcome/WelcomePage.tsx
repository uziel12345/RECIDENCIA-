import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth-store";
import { ROUTES } from "../../types/routes";
import { MapIcon, GraduationCapIcon, UsersIcon, BuildingIcon, ShieldIcon } from "../shared/Icons";

interface RoleCard {
  id: "student" | "visitor" | "staff" | "admin";
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  requiresLogin: boolean;
}

const roleCards: RoleCard[] = [
  {
    id: "student",
    title: "Alumno",
    description: "Encuentra tus aulas, revisa horarios y navega por el campus",
    icon: <GraduationCapIcon size={28} />,
    color: "var(--color-brand-700)",
    bgColor: "var(--color-brand-50)",
    borderColor: "var(--color-brand-100)",
    requiresLogin: false,
  },
  {
    id: "visitor",
    title: "Visitante",
    description: "Explora el campus con rutas simplificadas a puntos clave",
    icon: <UsersIcon size={28} />,
    color: "#059669",
    bgColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    requiresLogin: false,
  },
  {
    id: "staff",
    title: "Personal",
    description: "Gestiona edificios y puntos de navegacion del campus",
    icon: <BuildingIcon size={28} />,
    color: "#d97706",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    requiresLogin: true,
  },
  {
    id: "admin",
    title: "Administrador",
    description: "Control total: usuarios, edificios y configuracion",
    icon: <ShieldIcon size={28} />,
    color: "#dc2626",
    bgColor: "#fef2f2",
    borderColor: "#fecaca",
    requiresLogin: true,
  },
];

export function WelcomePage() {
  const navigate = useNavigate();
  const { selectRole, hasCompletedOnboarding } = useAuthStore();

  const handleRoleSelect = (card: RoleCard) => {
    if (card.requiresLogin) {
      navigate(`${ROUTES.LOGIN}?role=${card.id}`);
    } else {
      selectRole(card.id);
      if (!hasCompletedOnboarding) {
        navigate(ROUTES.ONBOARDING);
      } else {
        navigate(card.id === "student" ? ROUTES.STUDENT : ROUTES.VISITOR);
      }
    }
  };

  return (
    <div className="welcome-page">
      <div className="welcome-page__container">
        {/* Header */}
        <header className="welcome-page__header">
          <div className="welcome-page__logo">
            <div className="welcome-page__logo-icon">
              <MapIcon size={28} />
            </div>
            <div className="welcome-page__logo-text">
              <h1>Mapa ITO</h1>
              <p>Instituto Tecnologico de Oaxaca</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="welcome-page__main">
          <div className="welcome-page__intro">
            <h2>Bienvenido</h2>
            <p>Selecciona tu tipo de usuario para comenzar a explorar el campus</p>
          </div>

          <div className="welcome-page__roles">
            {roleCards.map((card) => (
              <button
                key={card.id}
                className="role-card"
                onClick={() => handleRoleSelect(card)}
                style={{
                  "--role-color": card.color,
                  "--role-bg": card.bgColor,
                  "--role-border": card.borderColor,
                } as React.CSSProperties}
              >
                <div className="role-card__icon">{card.icon}</div>
                <div className="role-card__content">
                  <h3 className="role-card__title">{card.title}</h3>
                  <p className="role-card__description">{card.description}</p>
                </div>
                {card.requiresLogin && (
                  <span className="role-card__badge">Requiere acceso</span>
                )}
                <div className="role-card__arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="welcome-page__footer">
          <p>Mapa 3D Interactivo del Campus</p>
        </footer>
      </div>
    </div>
  );
}
