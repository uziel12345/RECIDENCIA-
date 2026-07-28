import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/auth-store";
import { ROUTES } from "../../types/routes";

const FONT_DISPLAY = "var(--font-display)";
const FONT_BODY = "var(--font-body)";
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

const ROLE_CONTENT = {
  student: {
    title: "Bienvenido, Alumno",
    description:
      "Explora el campus, localiza edificios, aulas y servicios escolares, y traza rutas dentro del Instituto Tecnológico de Oaxaca.",
  },
  visitor: {
    title: "Bienvenido, Visitante",
    description:
      "Podrás explorar el campus, localizar edificios y trazar rutas a los puntos clave del Instituto Tecnológico de Oaxaca.",
  },
  default: {
    title: "Bienvenido al campus",
    description:
      "Podrás localizar edificios, consultar información del campus y trazar rutas dentro del Instituto Tecnológico de Oaxaca.",
  },
} as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { completeOnboarding, user } = useAuthStore();

  const content =
    user?.role === "student"
      ? ROLE_CONTENT.student
      : user?.role === "visitor"
        ? ROLE_CONTENT.visitor
        : ROLE_CONTENT.default;

  const handleContinue = () => {
    completeOnboarding();
    if (user?.role === "student") {
      navigate(ROUTES.STUDENT);
      return;
    }
    if (user?.role === "visitor") {
      navigate(ROUTES.VISITOR);
      return;
    }
    navigate(ROUTES.WELCOME);
  };

  const handleBack = () => {
    navigate(ROUTES.WELCOME);
  };

  return (
    <main className="theme-light-lock relative flex min-h-screen items-center justify-center overflow-hidden bg-[url('/Portada.jpeg')] bg-cover bg-center p-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(74,28,19,0.96)_0%,rgba(74,28,19,0.9)_18%,rgba(131,51,35,0.7)_40%,rgba(168,68,46,0.34)_58%,rgba(251,238,233,0.08)_78%,transparent_100%),linear-gradient(180deg,rgba(15,23,42,0.26),rgba(15,23,42,0.12))]" />

      <motion.section
        initial="hidden"
        animate="show"
        variants={listVariants}
        className="relative z-[1] w-full max-w-[480px] rounded-3xl border border-[rgba(245,219,208,0.72)] bg-white/95 p-7 shadow-[0_28px_70px_rgba(74,28,19,0.34)] backdrop-blur-xl"
      >
        <motion.button
          variants={itemVariants}
          type="button"
          onClick={handleBack}
          style={{ fontFamily: FONT_BODY }}
          className="mb-7 inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] py-1.5 pl-2 pr-3 text-[13px] font-semibold text-[var(--color-text-muted)] transition hover:border-[var(--color-border-strong)] hover:bg-white hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] focus-visible:ring-offset-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Volver
        </motion.button>

        <motion.div
          variants={itemVariants}
          className="mb-4 grid h-[76px] w-[76px] place-items-center overflow-hidden rounded-[18px] border border-[#eab8a3] bg-white shadow-[0_12px_28px_rgba(168,68,46,0.18)]"
          aria-hidden="true"
        >
          <img
            src="/ICONO-TEC.jpeg"
            alt=""
            className="block h-[70px] w-[70px] object-contain"
          />
        </motion.div>

        <motion.p
          variants={itemVariants}
          style={{ fontFamily: FONT_BODY }}
          className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-600)]"
        >
          Mapa interactivo ITO
        </motion.p>

        <motion.h1
          variants={itemVariants}
          style={{ fontFamily: FONT_DISPLAY }}
          className="mb-3.5 text-balance text-[32px] font-semibold leading-[1.1] tracking-tight text-[var(--color-text)]"
        >
          {content.title}
        </motion.h1>

        <motion.p
          variants={itemVariants}
          style={{ fontFamily: FONT_BODY }}
          className="mb-7 text-[15px] leading-relaxed text-[var(--color-text-muted)]"
        >
          {content.description}
        </motion.p>

        <motion.button
          variants={itemVariants}
          type="button"
          onClick={handleContinue}
          style={{ fontFamily: FONT_BODY }}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#a8442e_0%,#4a1c13_100%)] px-5 py-3.5 text-[15px] font-bold tracking-tight text-white shadow-[var(--shadow-brand)] transition hover:-translate-y-px hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] focus-visible:ring-offset-2"
        >
          Explorar el campus
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </motion.button>
      </motion.section>
    </main>
  );
}
