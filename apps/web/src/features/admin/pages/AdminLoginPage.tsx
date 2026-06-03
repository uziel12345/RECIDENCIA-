import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { ROUTES } from "../../../types/routes";

export function AdminLoginPage() {
  const { login, loadSession, loading, error, isAuthenticated, clearError } =
    useAdminAuthStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    clearError();

    if (isAuthenticated) {
      void navigate(ROUTES.ADMIN_BUILDINGS, { replace: true });
      return;
    }

    void loadSession().then((validSession) => {
      if (validSession) {
        void navigate(ROUTES.ADMIN_BUILDINGS, { replace: true });
      }
    });
  }, [clearError, isAuthenticated, loadSession, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const success = await login(username.trim(), password);

    if (success) {
      void navigate(ROUTES.ADMIN_BUILDINGS, { replace: true });
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #2563eb 100%)",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "28px",
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.35)",
          border: "1px solid #e2e8f0",
        }}
      >
        <header style={{ marginBottom: "24px" }}>
          <p
            style={{
              margin: "0 0 8px",
              color: "#2563eb",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            Panel administrativo
          </p>

          <h1
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "28px",
              lineHeight: 1.2,
            }}
          >
            Iniciar sesión
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            Accede para administrar edificios del mapa interactivo del ITO.
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="username"
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#334155",
              fontWeight: 700,
            }}
          >
            Usuario
          </label>

          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #cbd5e1",
              borderRadius: "14px",
              padding: "12px 14px",
              fontSize: "15px",
              outline: "none",
              marginBottom: "18px",
            }}
            placeholder="admin"
          />

          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#334155",
              fontWeight: 700,
            }}
          >
            Contraseña
          </label>

          <div style={{ position: "relative", marginBottom: "18px" }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #cbd5e1",
                borderRadius: "14px",
                padding: "12px 44px 12px 14px",
                fontSize: "15px",
                outline: "none",
              }}
              placeholder="Ingresa tu contraseña"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
              }}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {error ? (
            <div
              role="alert"
              style={{
                marginBottom: "18px",
                padding: "12px 14px",
                borderRadius: "14px",
                background: "#fee2e2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "14px",
              padding: "13px 16px",
              background: loading ? "#94a3b8" : "#2563eb",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Validando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
