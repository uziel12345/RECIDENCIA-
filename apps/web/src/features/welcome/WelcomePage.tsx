import { useNavigate } from "react-router-dom";
import { useState, type ReactNode, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/auth-store";
import { useAdminAuthStore } from "../../store/admin-auth-store";
import { ROUTES } from "../../types/routes";
import {
  GraduationCapIcon,
  UsersIcon,
  BuildingIcon,
} from "../../components/ui/Icons";

// Tokens globales definidos en styles/index.css (:root) — Fraunces para
// títulos/momentos de marca, Public Sans para el resto del texto.
const FONT_DISPLAY = "var(--font-display)";
const FONT_BODY = "var(--font-body)";

// Patrón de curvas de nivel (topográfico) muy sutil detrás de la tarjeta —
// referencia visual al propio producto (un mapa), no decoración genérica.
function TopographicPattern() {
  return (
    <svg
      className="pointer-events-none absolute -right-24 -top-24 z-0 h-[420px] w-[420px] opacity-[0.14] sm:-right-16 sm:-top-16"
      viewBox="0 0 400 400"
      fill="none"
      aria-hidden="true"
    >
      {[60, 100, 140, 180, 220, 260].map((r) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          stroke="white"
          strokeWidth="1.25"
          strokeDasharray={r % 120 === 0 ? undefined : "2 5"}
        />
      ))}
    </svg>
  );
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.22 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.36, ease: EASE_OUT } },
};

// Adelanta la descarga (no el parseo) del modelo 3D del campus tan pronto el
// usuario elige un rol, para que ya esté en caché HTTP cuando el visor
// (Student/VisitorPage, lazy-loaded) llame a useGLTF. No importa Three.js aquí
// a propósito — eso metería el chunk vendor-three en el bundle inicial.
function preloadCampusModel() {
  fetch("/models/campus.glb", { priority: "low" } as RequestInit).catch(() => {});
}

interface RoleCard {
  id: "student" | "visitor" | "admin-access";
  title: string;
  description: string;
  icon: ReactNode;
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

    preloadCampusModel();
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
    <div className="theme-light-lock relative flex min-h-screen items-center justify-center overflow-hidden bg-[url('/Portada.jpeg')] bg-cover bg-center p-5 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(74,28,19,0.96)_0%,rgba(74,28,19,0.9)_18%,rgba(131,51,35,0.72)_40%,rgba(168,68,46,0.36)_58%,rgba(251,238,233,0.08)_78%,transparent_100%),linear-gradient(180deg,rgba(15,23,42,0.28),rgba(15,23,42,0.12))]" />
      <TopographicPattern />

      <motion.div
        initial="hidden"
        animate="show"
        variants={cardVariants}
        className="relative z-[1] flex w-full max-w-[460px] flex-col overflow-hidden rounded-3xl border border-[rgba(245,219,208,0.72)] bg-white/95 shadow-[0_28px_70px_rgba(74,28,19,0.34)] backdrop-blur-xl"
      >
        <header className="relative overflow-hidden bg-[linear-gradient(135deg,#a8442e_0%,#4a1c13_100%)] px-7 pb-6 pt-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/[0.06]" />
          <div className="relative z-[1] flex items-center gap-3.5">
            <div className="grid h-[52px] w-[52px] flex-shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/25 bg-white">
              <img
                src="/ICONO-TEC.jpeg"
                alt="ITO"
                className="block h-12 w-12 object-contain"
              />
            </div>
            <div>
              <h1
                className="m-0 text-[26px] font-semibold leading-none tracking-tight text-white"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                Mapa ITO
              </h1>
              <p
                className="m-0 mt-1 text-[12px] text-white/75"
                style={{ fontFamily: FONT_BODY }}
              >
                Instituto Tecnológico de Oaxaca
              </p>
            </div>
          </div>
        </header>

        <main className="flex flex-col">
          <div className="px-7 pb-2 pt-6">
            <h2
              className="m-0 mb-1 text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-600)]"
              style={{ fontFamily: FONT_BODY }}
            >
              Acceso al campus
            </h2>
            <p
              className="m-0 text-[16px] font-medium leading-snug text-[var(--color-text)]"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              ¿Cómo deseas explorar el campus hoy?
            </p>
          </div>

          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-1 px-5 pb-2 pt-3"
          >
            {roleCards.map((card) => (
              <motion.button
                key={card.id}
                variants={itemVariants}
                onClick={() => handleRoleSelect(card)}
                className="group relative flex min-h-11 w-full items-center gap-3.5 rounded-2xl border border-transparent bg-transparent p-3.5 text-left transition hover:translate-x-0.5 hover:border-[color:var(--role-border)] hover:bg-[color:var(--role-bg)] hover:shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] focus-visible:ring-offset-2"
                style={
                  {
                    "--role-color": card.color,
                    "--role-bg": card.bgColor,
                    "--role-border": card.borderColor,
                  } as CSSProperties
                }
              >
                <span
                  className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-[color:var(--role-color)] opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
                <div
                  className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full border-[1.5px] border-[color:var(--role-border)] bg-[color:var(--role-bg)] text-[color:var(--role-color)] transition-transform group-hover:scale-105"
                  aria-hidden="true"
                >
                  {card.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    className="m-0 mb-0.5 text-[16px] font-semibold tracking-tight text-[var(--color-text)]"
                    style={{ fontFamily: FONT_DISPLAY }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="m-0 text-[12px] leading-snug text-[var(--color-text-muted)]"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    {card.description}
                  </p>
                </div>
                {card.action === "admin-login" && (
                  <span className="flex-shrink-0 whitespace-nowrap rounded-full border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-warning-text)]">
                    Requiere acceso
                  </span>
                )}
                <div
                  className="flex-shrink-0 text-[var(--color-text-subtle)] transition group-hover:translate-x-1 group-hover:text-[color:var(--role-color)]"
                  aria-hidden="true"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </main>

        <footer className="mt-1 border-t border-[rgba(229,229,229,0.74)] bg-white/50 px-7 pb-5 pt-4">
          <p
            className="m-0 text-center text-[11px] tracking-wide text-[var(--color-text-subtle)]"
            style={{ fontFamily: FONT_BODY }}
          >
            Mapa 3D interactivo · ITO Campus
          </p>
        </footer>
      </motion.div>

      <AnimatePresence>
        {showAdminSessionModal ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-[rgba(15,23,42,0.55)] p-5"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              className="w-[min(420px,100%)] rounded-2xl bg-white p-5 shadow-[0_22px_50px_rgba(15,23,42,0.25)]"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
            >
              <h2
                className="m-0 mb-2 text-[20px] font-semibold text-[var(--color-text)]"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                Sesión administrativa activa
              </h2>
              <p
                className="m-0 mb-4 leading-relaxed text-[var(--color-text-muted)]"
                style={{ fontFamily: FONT_BODY }}
              >
                Puedes continuar como {adminUser?.username ?? "administrador"} o
                cambiar de usuario.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.ADMIN_BUILDINGS)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-brand-700)] bg-[var(--color-brand-600)] px-3.5 font-extrabold text-white transition hover:bg-[var(--color-brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] focus-visible:ring-offset-2"
                >
                  Continuar
                </button>
                <button
                  type="button"
                  onClick={handleChangeAdminUser}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-border-strong)] bg-white px-3.5 font-extrabold text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] focus-visible:ring-offset-2"
                >
                  Cambiar usuario
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
