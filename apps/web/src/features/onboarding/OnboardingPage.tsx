import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth-store";
import { ROUTES } from "../../types/routes";

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
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(67,20,7,0.96)_0%,rgba(124,45,18,0.9)_18%,rgba(194,65,12,0.7)_40%,rgba(234,88,12,0.34)_58%,rgba(255,247,237,0.08)_78%,transparent_100%),linear-gradient(180deg,rgba(15,23,42,0.26),rgba(15,23,42,0.12))]" />

      <section className="relative z-[1] w-full max-w-[480px] animate-[ito-slide-in-up_0.3s_ease-out] rounded-3xl border border-[rgba(255,237,213,0.72)] bg-white/95 p-7 shadow-[0_28px_70px_rgba(67,20,7,0.34)] backdrop-blur-xl">
        <button
          type="button"
          onClick={handleBack}
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
        </button>

        <div
          className="mb-4 grid h-[76px] w-[76px] place-items-center overflow-hidden rounded-[18px] border border-[#fed7aa] bg-white shadow-[0_12px_28px_rgba(234,88,12,0.18)]"
          aria-hidden="true"
        >
          <img
            src="/ICONO-TEC.jpeg"
            alt=""
            className="block h-[70px] w-[70px] object-contain"
          />
        </div>

        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-brand-600)]">
          Mapa interactivo ITO
        </p>

        <h1 className="mb-3.5 text-balance text-[28px] font-extrabold leading-tight tracking-tight text-[var(--color-text)]">
          {content.title}
        </h1>

        <p className="mb-7 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
          {content.description}
        </p>

        <button
          type="button"
          onClick={handleContinue}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#ea580c_0%,#7c2d12_100%)] px-5 py-3.5 text-[15px] font-bold tracking-tight text-white shadow-[var(--shadow-brand)] transition hover:-translate-y-px hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-brand)] focus-visible:ring-offset-2"
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
        </button>
      </section>
    </main>
  );
}
