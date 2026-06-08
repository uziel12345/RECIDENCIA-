import { useState } from "react";
import { getStudentLocationApi } from "@ito-map/shared";
import type { StudentLocation } from "@ito-map/shared";
import { Icon } from "../../../components/ui/Icons";

export function AdminStudentLocationPage() {
  const [controlNumber, setControlNumber] = useState("");
  const [period, setPeriod] = useState("");
  const [at, setAt] = useState("");
  const [result, setResult] = useState<StudentLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const cn = controlNumber.trim();
    if (!cn) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getStudentLocationApi(cn, {
        period: period.trim() || undefined,
        at: at.trim() || undefined,
      });
      setResult(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error al consultar la ubicación";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ito-loc-page">
      <div className="ito-loc-page__inner">
        <div className="mb-7">
          <h1 className="ito-loc-page__title">Ubicación de Alumnos</h1>
          <p className="ito-loc-page__subtitle">
            Consulta en qué aula se encuentra un alumno según su horario registrado.
          </p>
          <div className="ito-notice ito-notice--blue">
            <strong>Frontera de seguridad:</strong> los datos personales de alumnos
            solo se sirven tras autenticación de servidor con el rol{" "}
            <em>Servicios Escolares</em> o superior. El acceso sin sesión activa
            devuelve 401.
          </div>
        </div>

        <div className="ito-form-card">
          <form onSubmit={handleSearch}>
            <div className="grid gap-3.5">
              <div>
                <label htmlFor="control-number" className="ito-form-label">
                  Número de control *
                </label>
                <input
                  id="control-number"
                  type="text"
                  value={controlNumber}
                  onChange={(e) => setControlNumber(e.target.value)}
                  placeholder="20221001"
                  required
                  className="ito-form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="period" className="ito-form-label">
                    Periodo (opcional)
                  </label>
                  <input
                    id="period"
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="2026-1"
                    className="ito-form-input"
                  />
                </div>

                <div>
                  <label htmlFor="at-time" className="ito-form-label">
                    Hora (opcional, HH:MM)
                  </label>
                  <input
                    id="at-time"
                    type="text"
                    value={at}
                    onChange={(e) => setAt(e.target.value)}
                    placeholder="09:30"
                    className="ito-form-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !controlNumber.trim()}
                className="ito-submit-btn"
              >
                {loading ? (
                  <>
                    <span className="ito-btn-spinner" aria-hidden="true" />
                    Consultando…
                  </>
                ) : (
                  <>
                    <Icon name="search" size={14} aria-hidden="true" />
                    Buscar ubicación
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="ito-alert ito-alert--error" role="alert">
            <span className="ito-alert__icon">
              <Icon name="alert" size={15} aria-hidden="true" />
            </span>
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="ito-result-card">
            <div className="ito-result-card__header">
              <div className="ito-result-card__icon ito-result-card__icon--blue">
                <Icon name="list" size={18} aria-hidden="true" />
              </div>
              <div>
                <div className="ito-result-card__name">{result.student.full_name}</div>
                <div className="ito-result-card__meta">
                  {result.student.control_number} · {result.student.program} · Sem.{" "}
                  {result.student.semester}
                </div>
              </div>
            </div>

            <div className="ito-result-card__body">
              {result.in_class ? (
                <>
                  <div className="ito-status-pill ito-status-pill--active">
                    <span className="ito-status-pill__dot" aria-hidden="true" />
                    <span className="ito-status-pill__label">En clase</span>
                  </div>
                  <div className="grid gap-2">
                    <LocationRow label="Materia" value={result.schedule!.subject} />
                    <LocationRow
                      label="Horario"
                      value={`${result.schedule!.start_time} – ${result.schedule!.end_time}`}
                    />
                    <LocationRow label="Periodo" value={result.schedule!.period} />
                    <LocationRow
                      label="Aula"
                      value={`${result.classroom!.code} — ${result.classroom!.name}${
                        result.classroom!.floor !== 0
                          ? `, Piso ${result.classroom!.floor}`
                          : ""
                      }`}
                    />
                    <LocationRow label="Edificio" value={result.building!.name} highlight />
                  </div>
                </>
              ) : (
                <div className="ito-loc-empty">
                  <Icon name="alert" size={15} aria-hidden="true" />
                  <span>No se encontró clase activa en el horario consultado.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LocationRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="ito-loc-row">
      <span className="ito-loc-row__label">{label}</span>
      <span
        className={
          highlight
            ? "ito-loc-row__value ito-loc-row__value--blue"
            : "ito-loc-row__value"
        }
      >
        {value}
      </span>
    </div>
  );
}
