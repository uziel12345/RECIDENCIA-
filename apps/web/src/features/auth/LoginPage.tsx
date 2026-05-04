import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore, type UserRole } from "../../store/auth-store";
import { ROUTES } from "../../types/routes";
import { MapIcon, ChevronLeftIcon, ShieldIcon, BuildingIcon } from "../shared/Icons";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") as UserRole | null;
  const role = roleParam === "admin" || roleParam === "staff" ? roleParam : "staff";

  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = role === "admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(email, password, role);
      if (success) {
        navigate(isAdmin ? ROUTES.ADMIN : ROUTES.STAFF);
      } else {
        setError("Credenciales incorrectas. Por favor verifica tus datos.");
      }
    } catch {
      setError("Error al iniciar sesion. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__container">
        {/* Back Button */}
        <button className="login-page__back" onClick={() => navigate(ROUTES.WELCOME)}>
          <ChevronLeftIcon size={20} />
          <span>Volver</span>
        </button>

        {/* Header */}
        <header className="login-page__header">
          <div className="login-page__logo">
            <div className="login-page__logo-icon">
              <MapIcon size={24} />
            </div>
            <span>Mapa ITO</span>
          </div>
        </header>

        {/* Login Card */}
        <div className="login-card">
          <div
            className="login-card__hero"
            style={{
              background: isAdmin
                ? "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
                : "linear-gradient(135deg, #d97706 0%, #92400e 100%)",
            }}
          >
            <div className="login-card__hero-icon">
              {isAdmin ? <ShieldIcon size={28} /> : <BuildingIcon size={28} />}
            </div>
            <div className="login-card__hero-text">
              <p className="login-card__hero-label">Acceso</p>
              <h2 className="login-card__hero-title">
                {isAdmin ? "Administrador" : "Personal"}
              </h2>
            </div>
          </div>

          <form className="login-card__form" onSubmit={handleSubmit}>
            {error && (
              <div className="login-card__error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="login-card__field">
              <label htmlFor="email">Correo electronico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ito.edu.mx"
                required
                autoComplete="email"
              />
            </div>

            <div className="login-card__field">
              <label htmlFor="password">Contrasena</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contrasena"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="login-card__submit"
              disabled={isLoading}
              style={{
                background: isAdmin ? "#dc2626" : "#d97706",
              }}
            >
              {isLoading ? (
                <span className="login-card__spinner" />
              ) : (
                "Iniciar Sesion"
              )}
            </button>

            <p className="login-card__help">
              Si olvidaste tu contrasena, contacta al administrador del sistema.
            </p>
          </form>
        </div>

        {/* Role Toggle */}
        <div className="login-page__toggle">
          <span>Acceder como:</span>
          <div className="login-page__toggle-buttons">
            <button
              className={`login-page__toggle-btn ${role === "staff" ? "is-active" : ""}`}
              onClick={() => navigate(`${ROUTES.LOGIN}?role=staff`)}
            >
              Personal
            </button>
            <button
              className={`login-page__toggle-btn ${role === "admin" ? "is-active" : ""}`}
              onClick={() => navigate(`${ROUTES.LOGIN}?role=admin`)}
            >
              Administrador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
