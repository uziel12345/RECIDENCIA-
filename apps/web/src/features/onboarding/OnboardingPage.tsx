import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth-store";
import { ROUTES } from "../../types/routes";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { completeOnboarding, user } = useAuthStore();

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

    if (user?.role === "staff") {
      navigate(ROUTES.STAFF);
      return;
    }

    if (user?.role === "admin") {
      navigate(ROUTES.ADMIN);
      return;
    }

    navigate(ROUTES.WELCOME);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#f8fafc",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "28px",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
          border: "1px solid #e2e8f0",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            color: "#2563eb",
            fontWeight: 800,
            fontSize: "14px",
          }}
        >
          Mapa interactivo ITO
        </p>

        <h1
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: "28px",
            lineHeight: 1.2,
          }}
        >
          Bienvenido al recorrido del campus
        </h1>

        <p
          style={{
            margin: "14px 0 0",
            color: "#475569",
            lineHeight: 1.6,
          }}
        >
          Podrás localizar edificios, consultar información del campus y trazar
          rutas dentro del Instituto Tecnológico de Oaxaca.
        </p>

        <button
          type="button"
          onClick={handleContinue}
          style={{
            width: "100%",
            marginTop: "24px",
            border: "none",
            borderRadius: "14px",
            padding: "12px 16px",
            background: "#2563eb",
            color: "#ffffff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Continuar
        </button>
      </section>
    </main>
  );
}