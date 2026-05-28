import { useNavigate } from "react-router-dom";
import { useState, type CSSProperties } from "react";
import { useAuthStore } from "../../store/auth-store";
import { useAdminAuthStore } from "../../store/admin-auth-store";
import { ROUTES } from "../../types/routes";
import { MapIcon, GraduationCapIcon, UsersIcon, BuildingIcon } from "../shared/Icons";

interface RoleCard {
  id: "student" | "visitor" | "admin-access";
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  action: "select-role" | "admin-login";
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
    action: "select-role",
  },
  {
    id: "visitor",
    title: "Visitante",
    description: "Explora el campus con rutas simplificadas a puntos clave",
    icon: <UsersIcon size={28} />,
    color: "#059669",
    bgColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    action: "select-role",
  },
  {
    id: "admin-access",
    title: "Personal del ITO",
    description: "Acceso institucional para administrar edificios del campus",
    icon: <BuildingIcon size={28} />,
    color: "#d97706",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    action: "admin-login",
  },
];

export function WelcomePage() {
  const navigate = useNavigate();
  const { selectRole, hasCompletedOnboarding } = useAuthStore();
  const {
    user: adminUser,
    isAuthenticated: hasAdminSession,
    loadSession,
    logout: logoutAdmin,
  } = useAdminAuthStore();
  const [showAdminSessionModal, setShowAdminSessionModal] = useState(false);

  const handleRoleSelect = async (card: RoleCard) => {
    if (card.action === "admin-login") {
      if (hasAdminSession) {
        const sessionIsReady = adminUser ? true : await loadSession();
        if (sessionIsReady) {
          setShowAdminSessionModal(true);
          return;
        }
      }

      navigate(ROUTES.ADMIN_LOGIN);
      return;
    }

    if (card.id !== "student" && card.id !== "visitor") {
      return;
    }

    selectRole(card.id);
    if (!hasCompletedOnboarding) {
      navigate(ROUTES.ONBOARDING);
    } else {
      navigate(card.id === "student" ? ROUTES.STUDENT : ROUTES.VISITOR);
    }
  };

  const handleChangeAdminUser = () => {
    logoutAdmin();
    setShowAdminSessionModal(false);
    navigate(ROUTES.ADMIN_LOGIN);
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
                {card.action === "admin-login" && (
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

      {showAdminSessionModal ? (
        <div style={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Sesión administrativa activa</h2>
            <p style={styles.modalText}>
              Puedes continuar como {adminUser?.username ?? "administrador"} o cambiar de usuario.
            </p>
            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_BUILDINGS)}
                style={styles.primaryButton}
              >
                Continuar
              </button>
              <button type="button" onClick={handleChangeAdminUser} style={styles.secondaryButton}>
                Cambiar usuario
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    display: "grid",
    placeItems: "center",
    background: "rgba(15, 23, 42, 0.55)",
    padding: "20px",
    zIndex: 50,
  },
  modal: {
    width: "min(420px, 100%)",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 22px 50px rgba(15, 23, 42, 0.25)",
  },
  modalTitle: {
    margin: "0 0 8px",
    color: "#0f172a",
    fontSize: "22px",
  },
  modalText: {
    margin: "0 0 18px",
    color: "#475569",
    lineHeight: 1.5,
  },
  modalActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "1px solid #1d4ed8",
    borderRadius: "12px",
    padding: "10px 14px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "10px 14px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
  },
};
