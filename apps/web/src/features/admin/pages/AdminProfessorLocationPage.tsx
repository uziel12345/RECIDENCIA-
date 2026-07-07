import type { CSSProperties } from "react";
import { useState } from "react";
import {
  ROLE_PERMISSIONS,
  importProfessorSchedulesApi,
  searchProfessorLocationApi,
  type ProfessorLocationSearch,
  type ProfessorScheduleImportResult,
} from "@ito-map/shared";
import { AdminLayout } from "../components/AdminLayout";
import { useAdminAuthStore } from "../../../store/admin-auth-store";

const DAY_LABELS: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miercoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sabado",
  7: "Domingo",
};

export function AdminProfessorLocationPage() {
  const user = useAdminAuthStore((state) => state.user);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("");
  const [at, setAt] = useState("");
  const [result, setResult] = useState<ProfessorLocationSearch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ProfessorScheduleImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const canImport = user ? ROLE_PERMISSIONS[user.role].can_manage_professors : false;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await searchProfessorLocationApi(q, {
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

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const data = await importProfessorSchedulesApi(importFile);
      setImportResult(data);
      setImportFile(null);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Error al importar el archivo");
    } finally {
      setImporting(false);
    }
  }

  return (
    <AdminLayout>
      <div style={s.page}>
        <header style={s.header}>
          <div style={s.headerIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
              <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
          </div>
          <div>
            <p style={s.overline}>Consulta academica</p>
            <h1 style={s.title}>Ubicacion de Profesores</h1>
            <p style={s.subtitle}>Consulta en que aula imparte clase un profesor segun su horario.</p>
          </div>
        </header>

        <div style={s.notice}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>
            Requiere sesión activa con rol <strong style={{ color: "#6ee7b7" }}>Recursos Humanos</strong> o superior. Acceso sin sesión devuelve 401.
          </span>
        </div>

        {canImport ? (
          <div style={s.formCard}>
            <form onSubmit={handleImport}>
              <div style={s.formBody}>
                <div style={s.importHeader}>
                  <div>
                    <p style={s.cardTitle}>Importar Excel</p>
                    <p style={s.cardSubtitle}>Carga horarios de profesores desde un archivo .xlsx.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={importing || !importFile}
                    style={{
                      ...s.btnSearch,
                      ...(importing || !importFile ? s.btnDisabled : {}),
                    }}
                  >
                    {importing ? (
                      <>
                        <span style={s.spinner} />
                        Importando...
                      </>
                    ) : (
                      "Importar Excel"
                    )}
                  </button>
                </div>

                <div style={s.fieldGroup}>
                  <label htmlFor="professor-schedule-file" style={s.label}>Archivo .xlsx</label>
                  <input
                    id="professor-schedule-file"
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(event) => {
                      setImportFile(event.target.files?.[0] ?? null);
                      setImportError(null);
                      setImportResult(null);
                    }}
                    style={s.input}
                  />
                </div>
              </div>
            </form>

            {importError ? (
              <div role="alert" style={{ ...s.alertError, marginTop: 14, marginBottom: 0 }}>
                {importError}
              </div>
            ) : null}

            {importResult ? (
              <div style={s.importResult}>
                <DataRow label="Profesores creados/actualizados" value={String(importResult.professors_upserted)} />
                <DataRow label="Horarios insertados" value={String(importResult.schedules_created)} />
                <DataRow label="Filas leidas" value={String(importResult.rows_read)} />
                {importResult.warnings.length ? (
                  <div style={s.warningBox}>
                    <p style={s.warningTitle}>Advertencias de aulas no encontradas</p>
                    <ul style={s.warningList}>
                      {importResult.warnings.map((warning, index) => (
                        <li key={`${warning}-${index}`}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p style={s.successText}>Importacion completada sin advertencias.</p>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        <div style={s.formCard}>
          <form onSubmit={handleSearch}>
            <div style={s.formBody}>
              <div style={s.fieldGroup}>
                <label htmlFor="professor-query" style={s.label}>RFC o nombre del profesor *</label>
                <input
                  id="professor-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="EMP001"
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
                    placeholder="10:00"
                    style={s.input}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading || !query.trim()} style={{ ...s.btnSearch, ...(loading || !query.trim() ? s.btnDisabled : {}) }}>
                {loading ? (
                  <>
                    <span style={s.spinner} />
                    Consultando...
                  </>
                ) : !query.trim() ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Ingresa un número de empleado
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

        {result?.candidates.length ? (
          <div style={s.resultCard}>
            <p style={s.resultName}>Coincidencias encontradas</p>
            <div style={s.resultDivider} />
            <div style={s.dataGrid}>
              {result.candidates.map((candidate) => (
                <DataRow key={candidate.id} label={candidate.rfc ?? candidate.employee_number} value={candidate.full_name} />
              ))}
            </div>
          </div>
        ) : null}

        {result?.professor ? (
          <div style={s.resultCard}>
            <div style={s.resultHeader}>
              <div style={s.resultAvatar}>{result.professor.full_name[0]?.toUpperCase() ?? "P"}</div>
              <div>
                <p style={s.resultName}>{result.professor.full_name}</p>
                <p style={s.resultMeta}>{result.professor.rfc ?? result.professor.employee_number} - {result.professor.department}</p>
              </div>
            </div>

            <div style={s.resultDivider} />

            {result.schedules.length ? (
              <div style={s.dataGrid}>
                {result.schedules.map((item) => (
                  <div key={item.schedule.id} style={s.scheduleBlock}>
                    <DataRow label="RFC" value={result.professor!.rfc ?? result.professor!.employee_number} />
                    <DataRow label="Nombre del profesor" value={result.professor!.full_name} />
                    <DataRow label="Periodo" value={item.schedule.period} />
                    <DataRow label="Materia" value={item.schedule.subject_name ?? item.schedule.subject} />
                    <DataRow label="Grupo" value={item.schedule.group_code ?? "-"} />
                    <DataRow label="Carrera" value={item.schedule.career_name ?? item.schedule.career_code ?? "-"} />
                    <DataRow label="Dia" value={DAY_LABELS[item.schedule.day_of_week] ?? String(item.schedule.day_of_week)} />
                    <DataRow label="Hora" value={`${item.schedule.start_time} - ${item.schedule.end_time}`} />
                    <DataRow label="Aula" value={`${item.classroom.code} - ${item.classroom.name}`} highlight />
                  </div>
                ))}
              </div>
            ) : (
              <div style={s.noClass}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                No se encontraron horarios para la consulta.
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
  page: { padding: "28px 32px", minHeight: "100%", maxWidth: 760 },
  header: { display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 },
  overline: { margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.08em" },
  title: { margin: "0 0 5px", fontSize: 26, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.1 },
  subtitle: { margin: 0, fontSize: 14, color: "#64748b" },
  notice: { display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 14px", background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 10, fontSize: 13, color: "#94a3b8", lineHeight: 1.5, marginBottom: 22 },
  formCard: { background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: "22px 24px", marginBottom: 20 },
  formBody: { display: "flex", flexDirection: "column", gap: 14 },
  importHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  cardTitle: { margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" },
  cardSubtitle: { margin: "4px 0 0", fontSize: 13, color: "#64748b" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  rowGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: { fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { border: "1px solid #334155", borderRadius: 10, padding: "10px 13px", fontSize: 14, background: "#0f172a", color: "#f1f5f9", outline: "none", width: "100%", boxSizing: "border-box" },
  btnSearch: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", borderRadius: 10, padding: "11px 20px", background: "#10b981", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  btnDisabled: { background: "#14524b", color: "#94a3b8", cursor: "not-allowed", opacity: 0.72 },
  spinner: { width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" },
  alertError: { display: "flex", alignItems: "center", gap: 9, marginBottom: 18, padding: "12px 15px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 13.5 },
  resultCard: { background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: "22px 24px", marginBottom: 20 },
  resultHeader: { display: "flex", alignItems: "center", gap: 13 },
  resultAvatar: { width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #10b981, #047857)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 },
  resultName: { margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" },
  resultMeta: { margin: "3px 0 0", fontSize: 12.5, color: "#64748b" },
  resultDivider: { height: 1, background: "#334155", margin: "16px 0" },
  dataGrid: { display: "flex", flexDirection: "column", gap: 6 },
  importResult: { display: "flex", flexDirection: "column", gap: 8, marginTop: 16 },
  warningBox: { padding: "12px 14px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.22)", color: "#fbbf24" },
  warningTitle: { margin: "0 0 8px", fontSize: 13, fontWeight: 700 },
  warningList: { margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.5 },
  successText: { margin: "4px 0 0", fontSize: 13, color: "#6ee7b7" },
  scheduleBlock: { display: "flex", flexDirection: "column", gap: 6, paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid #334155" },
  noClass: { display: "flex", alignItems: "center", gap: 8, padding: "16px", background: "#161f2e", borderRadius: 10, fontSize: 13.5, color: "#475569" },
};

const sd: Record<string, CSSProperties> = {
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "8px 12px", background: "#161f2e", borderRadius: 8 },
  label: { fontSize: 12.5, color: "#64748b" },
  value: { fontSize: 13, color: "#cbd5e1", fontWeight: 500, textAlign: "right" },
  valueHighlight: { fontSize: 13, color: "#34d399", fontWeight: 700, textAlign: "right" },
};
