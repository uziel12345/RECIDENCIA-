import { useState } from "react";
import { getProfessorLocationApi } from "@ito-map/shared";
import type { ProfessorLocation } from "@ito-map/shared";
import { Icon } from "../../../components/ui/Icons";

export function AdminProfessorLocationPage() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [period, setPeriod] = useState("");
  const [at, setAt] = useState("");
  const [result, setResult] = useState<ProfessorLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const en = employeeNumber.trim();
    if (!en) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getProfessorLocationApi(en, {
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
          <h1 className="ito-loc-page__title">Ubicación de Profesores</h1>
          <p className="ito-loc-page__subtitle">
            Consulta en qué aula imparte clase un profesor según su horario registrado.
          </p>
          <div className="ito-notice ito-notice--green">
            <strong>Frontera de seguridad:</strong> los datos personales de profesores
            solo se sirven tras autenticación de servidor con el rol{" "}
            <em>Recursos Humanos</em> o superior. El acceso sin sesión activa
            devuelve 401.
          </div>
        </div>

        <div className="ito-form-card">
          <form onSubmit={handleSearch}>
            <div className="grid gap-3.5">
              <div>
                <label htmlFor="employee-number" className="ito-form-label">
                  Número de empleado *
                </label>
                <input
                  id="employee-number"
                  type="text"
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  placeholder="EMP001"
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
                    placeholder="10:00"
                    className="ito-form-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !employeeNumber.trim()}
                className="ito-submit-btn ito-submit-btn--green"
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
              <div className="ito-result-card__icon ito-result-card__icon--green">
                <Icon name="list" size={18} aria-hidden="true" />
              </div>
              <div>
                <div className="ito-result-card__name">
                  {result.professor.full_name}
                </div>
                <div className="ito-result-card__meta">
                  {result.professor.employee_number} · {result.professor.department}
                </div>
              </div>
            </div>

            <div className="ito-result-card__body">
              {result.in_class ? (
                <>
                  <div className="ito-status-pill ito-status-pill--active">
                    <span className="ito-status-pill__dot" aria-hidden="true" />
                    <span className="ito-status-pill__label">Impartiendo clase</span>
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
            ? "ito-loc-row__value ito-loc-row__value--green"
            : "ito-loc-row__value"
        }
      >
        {value}
      </span>
    </div>
  );
}
