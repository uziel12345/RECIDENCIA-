import { useState } from "react";
import { MapIcon, ShieldIcon, InfoIcon } from "../../shared/Icons";

export function SystemSettings() {
  const [settings, setSettings] = useState({
    allowPublicAccess: true,
    showInactiveBuildings: false,
    enableGeolocation: true,
    defaultZoom: 1.5,
    mapRotation: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="system-settings">
      <header className="system-settings__header">
        <div className="system-settings__title">
          <h1>Configuracion del Sistema</h1>
          <p>Ajusta las opciones generales del mapa</p>
        </div>
      </header>

      <div className="system-settings__content">
        <section className="system-settings__section">
          <div className="system-settings__section-header">
            <ShieldIcon size={20} />
            <h2>Acceso y Seguridad</h2>
          </div>

          <div className="system-settings__option">
            <div className="system-settings__option-info">
              <span className="system-settings__option-title">Acceso publico</span>
              <span className="system-settings__option-desc">
                Permitir que visitantes y alumnos accedan al mapa sin autenticacion
              </span>
            </div>
            <button
              className={`system-settings__toggle ${settings.allowPublicAccess ? "is-active" : ""}`}
              onClick={() => handleToggle("allowPublicAccess")}
            >
              <span className="system-settings__toggle-knob" />
            </button>
          </div>

          <div className="system-settings__option">
            <div className="system-settings__option-info">
              <span className="system-settings__option-title">Mostrar edificios inactivos</span>
              <span className="system-settings__option-desc">
                Los edificios marcados como inactivos seran visibles en el mapa
              </span>
            </div>
            <button
              className={`system-settings__toggle ${settings.showInactiveBuildings ? "is-active" : ""}`}
              onClick={() => handleToggle("showInactiveBuildings")}
            >
              <span className="system-settings__toggle-knob" />
            </button>
          </div>
        </section>

        <section className="system-settings__section">
          <div className="system-settings__section-header">
            <MapIcon size={20} />
            <h2>Opciones del Mapa</h2>
          </div>

          <div className="system-settings__option">
            <div className="system-settings__option-info">
              <span className="system-settings__option-title">Geolocalizacion</span>
              <span className="system-settings__option-desc">
                Permitir que los usuarios vean su ubicacion en el mapa
              </span>
            </div>
            <button
              className={`system-settings__toggle ${settings.enableGeolocation ? "is-active" : ""}`}
              onClick={() => handleToggle("enableGeolocation")}
            >
              <span className="system-settings__toggle-knob" />
            </button>
          </div>

          <div className="system-settings__option">
            <div className="system-settings__option-info">
              <span className="system-settings__option-title">Rotacion del mapa</span>
              <span className="system-settings__option-desc">
                Permitir que los usuarios roten el mapa 3D
              </span>
            </div>
            <button
              className={`system-settings__toggle ${settings.mapRotation ? "is-active" : ""}`}
              onClick={() => handleToggle("mapRotation")}
            >
              <span className="system-settings__toggle-knob" />
            </button>
          </div>
        </section>

        <section className="system-settings__section">
          <div className="system-settings__section-header">
            <InfoIcon size={20} />
            <h2>Informacion del Sistema</h2>
          </div>

          <div className="system-settings__info-grid">
            <div className="system-settings__info-item">
              <span className="system-settings__info-label">Version</span>
              <span className="system-settings__info-value">1.0.0</span>
            </div>
            <div className="system-settings__info-item">
              <span className="system-settings__info-label">Ultima actualizacion</span>
              <span className="system-settings__info-value">15 de Mayo, 2024</span>
            </div>
            <div className="system-settings__info-item">
              <span className="system-settings__info-label">Modelo 3D</span>
              <span className="system-settings__info-value">campus.glb</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
