import { FormEvent, useEffect, useState } from "react";
import { useAdminAuthStore } from "../../../store/admin-auth-store";

export function AdminLoginPage() {
  const login = useAdminAuthStore((state) => state.login);
  const loadSession = useAdminAuthStore((state) => state.loadSession);
  const clearError = useAdminAuthStore((state) => state.clearError);
  const loading = useAdminAuthStore((state) => state.loading);
  const error = useAdminAuthStore((state) => state.error);
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const user = useAdminAuthStore((state) => state.user);

  const [usernameOrEmail, setUsernameOrEmail] = useState("admin");
  const [password, setPassword] = useState("");

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const success = await login(usernameOrEmail, password);

    if (success) {
      window.history.pushState({}, "", "/admin/buildings");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #0f766e 100%)",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "28px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
        }}
      >
        <div style={{ marginBottom: "22px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "18px",
              display: "grid",
              placeItems: "center",
              background: "#0f766e",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "20px",
              marginBottom: "14px",
            }}
          >
            ITO
          </div>

          <h1
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "26px",
              lineHeight: 1.15,
            }}
          >
            Panel administrador
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#64748b",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Inicia sesión para administrar edificios, rutas y contenido del mapa
            interactivo.
          </p>
        </div>

        {isAuthenticated && user ? (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              borderRadius: "14px",
              background: "#ecfdf5",
              border: "1px solid #bbf7d0",
              color: "#166534",
              fontSize: "14px",
              lineHeight: 1.45,
            }}
          >
            Sesión activa como <strong>{user.username}</strong>. Redirigiendo al
            panel...
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              borderRadius: "14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: "14px",
              lineHeight: 1.45,
            }}
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                color: "#334155",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              Usuario o correo
            </span>

            <input
              value={usernameOrEmail}
              onChange={(event) => {
                clearError();
                setUsernameOrEmail(event.target.value);
              }}
              placeholder="admin"
              autoComplete="username"
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #cbd5e1",
                borderRadius: "14px",
                padding: "12px 14px",
                fontSize: "15px",
                outline: "none",
              }}
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: "18px",
            }}
          >
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                color: "#334155",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              Contraseña
            </span>

            <input
              value={password}
              onChange={(event) => {
                clearError();
                setPassword(event.target.value);
              }}
              type="password"
              placeholder="Contraseña"
              autoComplete="current-password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #cbd5e1",
                borderRadius: "14px",
                padding: "12px 14px",
                fontSize: "15px",
                outline: "none",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading || !usernameOrEmail.trim() || !password}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "14px",
              padding: "13px 16px",
              cursor:
                loading || !usernameOrEmail.trim() || !password
                  ? "not-allowed"
                  : "pointer",
              background:
                loading || !usernameOrEmail.trim() || !password
                  ? "#94a3b8"
                  : "#0f766e",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "15px",
              boxShadow: "0 12px 26px rgba(15, 118, 110, 0.28)",
            }}
          >
            {loading ? "Iniciando sesión..." : "Entrar al panel"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            window.history.pushState({}, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
          style={{
            width: "100%",
            marginTop: "12px",
            border: "1px solid #cbd5e1",
            borderRadius: "14px",
            padding: "12px 16px",
            cursor: "pointer",
            background: "#ffffff",
            color: "#334155",
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          Volver al mapa
        </button>
      </section>
    </main>
  );
}