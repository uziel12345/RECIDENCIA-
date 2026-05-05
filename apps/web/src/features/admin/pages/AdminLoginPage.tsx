import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAdminAuthStore } from "../../../store/admin-auth-store";

export function AdminLoginPage() {
  const { login, loadSession, loading, error, isAuthenticated, clearError } =
    useAdminAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    clearError();

    if (isAuthenticated) {
      window.location.href = "/admin/buildings";
      return;
    }

    void loadSession().then((validSession) => {
      if (validSession) {
        window.location.href = "/admin/buildings";
      }
    });
  }, [clearError, isAuthenticated, loadSession]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const success = await login(username.trim(), password);

    if (success) {
      window.location.href = "/admin/buildings";
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

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
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
            placeholder="Ingresa tu contraseña"
          />

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