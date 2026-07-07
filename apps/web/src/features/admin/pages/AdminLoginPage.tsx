import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { ROUTES } from "../../../types/routes";

const inputCls =
  "w-full min-h-11 rounded-2xl border border-[#334155] bg-[#0f172a] px-3.5 py-3 text-[15px] text-[#e2e8f0] placeholder:text-[#475569] outline-none transition-[border-color,box-shadow] duration-[180ms] focus:border-[#ea580c] focus:ring-2 focus:ring-[rgba(234,88,12,0.45)]";

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
    <main className="grid min-h-screen place-items-center bg-[#0f172a] p-6">
      <section className="w-full max-w-[420px] rounded-3xl border border-[#1e293b] bg-[#1e293b] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="mb-5">
          <button
            type="button"
            onClick={() => navigate(ROUTES.WELCOME, { replace: true })}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[13px] font-semibold text-[#94a3b8] transition-colors duration-[180ms] hover:bg-[#0f172a] hover:text-[#cbd5e1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(234,88,12,0.45)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Ir al inicio
          </button>
        </div>

        <header className="mb-6">
          <div
            className="mb-4 grid h-[68px] w-[68px] place-items-center overflow-hidden rounded-[18px] border border-[#334155] bg-white"
            aria-hidden="true"
          >
            <img
              src="/ICONO-TEC.jpeg"
              alt=""
              className="block h-[62px] w-[62px] object-contain"
            />
          </div>

          <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#f97316]">
            Panel administrativo
          </p>
          <h1 className="m-0 text-[28px] font-bold leading-tight text-[#f1f5f9]">
            Iniciar sesión
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-[#64748b]">
            Accede para administrar edificios del mapa interactivo del ITO.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <label
            htmlFor="username"
            className="mb-2 text-[12.5px] font-bold uppercase tracking-wide text-[#94a3b8]"
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
            className={`${inputCls} mb-[18px]`}
            placeholder="admin"
          />

          <label
            htmlFor="password"
            className="mb-2 text-[12.5px] font-bold uppercase tracking-wide text-[#94a3b8]"
          >
            Contraseña
          </label>
          <div className="relative mb-[18px]">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className={`${inputCls} pr-11`}
              placeholder="Ingresa tu contraseña"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#94a3b8] transition-colors duration-[180ms] hover:bg-[#0f172a] hover:text-[#cbd5e1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(234,88,12,0.45)]"
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
              className="mb-[18px] rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] px-3.5 py-3 text-[13.5px] font-semibold text-[#fca5a5]"
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#ea580c] px-4 py-3 text-[15px] font-extrabold text-white shadow-[0_6px_18px_rgba(234,88,12,0.28)] transition-[transform,background-color] duration-[180ms] hover:-translate-y-px hover:bg-[#c2410c] active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#475569] disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(234,88,12,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e293b]"
          >
            {loading ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
                Validando…
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
