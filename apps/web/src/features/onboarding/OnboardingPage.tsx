import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth-store";
import { ROUTES } from "../../types/routes";

const ROLE_CONTENT = {
  student: {
    title: "Bienvenido, Alumno",
    description:
      "Podrás localizar tus aulas, consultar tu horario de clases y trazar rutas dentro del Instituto Tecnológico de Oaxaca.",
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
    <main className="onboarding-page">
      <section className="onboarding-card">
        <button
          type="button"
          onClick={handleBack}
          className="onboarding-card__back"
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

        <div className="onboarding-card__logo" aria-hidden="true">
          <img src="/ICONO-TEC.jpeg" alt="" className="onboarding-card__logo-img" />
        </div>

        <p className="onboarding-card__label">Mapa interactivo ITO</p>

        <h1 className="onboarding-card__title">{content.title}</h1>

        <p className="onboarding-card__desc">{content.description}</p>

        <button
          type="button"
          onClick={handleContinue}
          className="onboarding-card__cta"
        >
          Explorar el campus
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </section>
    </main>
  );
}
