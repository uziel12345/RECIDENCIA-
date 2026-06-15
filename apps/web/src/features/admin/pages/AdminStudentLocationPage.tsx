import type { CSSProperties } from "react";
import { useState } from "react";
import { getStudentLocationApi, type StudentLocation } from "@ito-map/shared";
import { AdminLayout } from "../components/AdminLayout";

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
      setError(err instanceof Error ? err.message : "Error al consultar la ubicación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div style={s.page}>
        <header style={s.header}>
          <div style={s.headerIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div>
            <p style={s.overline}>Consulta académica</p>
            <h1 style={s.title}>Ubicación de Alumnos</h1>
            <p style={s.subtitle}>
              Consulta en qué aula se encuentra un alumno según su horario.
            </p>
          </div>
        </header>

        <div style={s.notice}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>
            Requiere sesión activa con rol <strong style={{ color: "#fdba74" }}>Servicios Escolares</strong> o superior. Acceso sin sesión devuelve 401.
          </span>
        </div>

        <div style={s.formCard}>
          <form onSubmit={handleSearch}>
            <div style={s.formBody}>
              <div style={s.fieldGroup}>
                <label htmlFor="control-number" style={s.label}>
                  Número de control *
                </label>
                <input
                  id="control-number"
                  type="text"
                  value={controlNumber}
                  onChange={(e) => setControlNumber(e.target.value)}
                  placeholder="20221001"
                  required
                  style={s.input}
                />
              </div>

              <div style={s.rowGrid}>
                <div style={s.fieldGroup}>
                  <label htmlFor="period" style={s.label}>Periodo (opcional)</label>
                  <input
                    id="period"
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="2026-1"
                    style={s.input}
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label htmlFor="at-time" style={s.label}>Hora (opcional, HH:MM)</label>
                  <input
                    id="at-time"
                    type="text"
                    value={at}
                    onChange={(e) => setAt(e.target.value)}
                    placeholder="09:30"
                    style={s.input}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !controlNumber.trim()}
                style={{
                  ...s.btnSearch,
                  ...(loading || !controlNumber.trim() ? s.btnDisabled : {}),
                }}
              >
                {loading ? (
                  <>
                    <span style={s.spinner} />
                    Consultando...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Buscar ubicación
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {error ? (
          <div role="alert" style={s.alertError}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        ) : null}

        {result ? (
          <div style={s.resultCard}>
            <div style={s.resultHeader}>
              <div style={s.resultAvatar}>
                {result.student.full_name[0]?.toUpperCase() ?? "A"}
              </div>
              <div>
                <p style={s.resultName}>{result.student.full_name}</p>
                <p style={s.resultMeta}>
                  {result.student.control_number} · {result.student.program} · Sem. {result.student.semester}
                </p>
              </div>
            </div>

            <div style={s.resultDivider} />

            {result.in_class ? (
              <>
                <div style={s.statusPill}>
                  <span style={s.pillDot} />
                  En clase ahora
                </div>
                <div style={s.dataGrid}>
                  <DataRow label="Materia" value={result.schedule!.subject} />
                  <DataRow label="Horario" value={`${result.schedule!.start_time} – ${result.schedule!.end_time}`} />
                  <DataRow label="Periodo" value={result.schedule!.period} />
                  <DataRow label="Aula" value={`${result.classroom!.code} — ${result.classroom!.name}${result.classroom!.floor !== 0 ? `, Piso ${result.classroom!.floor}` : ""}`} />
                  <DataRow label="Edificio" value={result.building!.name} highlight />
                </div>
              </>
            ) : (
              <div style={s.noClass}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                No se encontró clase activa en el horario consultado.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}

function DataRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={sd.row}>
      <span style={sd.label}>{label}</span>
      <span style={highlight ? sd.valueHighlight : sd.value}>{value}</span>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: { padding: "28px 32px", minHeight: "100%", maxWidth: 680 },
  header: { display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, background: "rgba(234,88,12,0.1)", border: "1px solid rgba(234,88,12,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 },
  overline: { margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.08em" },
  title: { margin: "0 0 5px", fontSize: 26, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.1 },
  subtitle: { margin: 0, fontSize: 14, color: "#64748b" },
  notice: { display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 14px", background: "rgba(234,88,12,0.07)", border: "1px solid rgba(234,88,12,0.15)", borderRadius: 10, fontSize: 13, color: "#94a3b8", lineHeight: 1.5, marginBottom: 22 },
  formCard: { background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: "22px 24px", marginBottom: 20 },
  formBody: { display: "flex", flexDirection: "column", gap: 14 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  rowGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: { fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { border: "1px solid #334155", borderRadius: 10, padding: "10px 13px", fontSize: 14, background: "#0f172a", color: "#f1f5f9", outline: "none", width: "100%", boxSizing: "border-box" },
  btnSearch: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", borderRadius: 10, padding: "11px 20px", background: "#f97316", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  btnDisabled: { background: "#1e3a5f", color: "#475569", cursor: "not-allowed" },
  spinner: { width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" },
  alertError: { display: "flex", alignItems: "center", gap: 9, marginBottom: 18, padding: "12px 15px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 13.5 },
  resultCard: { background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: "22px 24px" },
  resultHeader: { display: "flex", alignItems: "center", gap: 13 },
  resultAvatar: { width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #f97316, #c2410c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 },
  resultName: { margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" },
  resultMeta: { margin: "3px 0 0", fontSize: 12.5, color: "#64748b" },
  resultDivider: { height: 1, background: "#334155", margin: "16px 0" },
  statusPill: { display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 99, fontSize: 12.5, fontWeight: 600, color: "#86efac", marginBottom: 16 },
  pillDot: { width: 6, height: 6, borderRadius: "50%", background: "#22c55e" },
  dataGrid: { display: "flex", flexDirection: "column", gap: 6 },
  noClass: { display: "flex", alignItems: "center", gap: 8, padding: "16px", background: "#161f2e", borderRadius: 10, fontSize: 13.5, color: "#475569" },
};

const sd: Record<string, CSSProperties> = {
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#161f2e", borderRadius: 8 },
  label: { fontSize: 12.5, color: "#64748b" },
  value: { fontSize: 13, color: "#cbd5e1", fontWeight: 500 },
  valueHighlight: { fontSize: 13, color: "#60a5fa", fontWeight: 700 },
};


