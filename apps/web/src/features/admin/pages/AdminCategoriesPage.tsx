import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { getCategoriesApi } from "@ito-map/shared";
import type { BuildingCategory } from "@ito-map/shared";
import { AdminLayout } from "../components/AdminLayout";

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<BuildingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategoriesApi()
      .then(setCategories)
      .catch(() => setError("No se pudieron cargar las categorías. Verifica la conexión."))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = categories.filter((c) => c.is_active).length;

  return (
    <AdminLayout>
      <div style={s.page}>
        <header style={s.header}>
          <div>
            <p style={s.overline}>Gestión de campus</p>
            <h1 style={s.title}>Categorías</h1>
            <p style={s.subtitle}>
              Categorías de edificios disponibles en el mapa interactivo del ITO.
            </p>
          </div>
        </header>

        {error ? (
          <div role="alert" style={s.alertError}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        ) : null}

        {!loading && !error && (
          <div style={s.statsRow}>
            <div style={s.stat}>
              <span style={s.statValue}>{categories.length}</span>
              <span style={s.statLabel}>Total</span>
            </div>
            <div style={s.stat}>
              <span style={{ ...s.statValue, color: "#22c55e" }}>{activeCount}</span>
              <span style={s.statLabel}>Activas</span>
            </div>
            <div style={s.stat}>
              <span style={{ ...s.statValue, color: "#f59e0b" }}>{categories.length - activeCount}</span>
              <span style={s.statLabel}>Inactivas</span>
            </div>
          </div>
        )}

        <div style={s.tableWrap}>
          {loading ? (
            <div style={s.emptyState}>
              <div style={s.spinner} />
              <p style={s.emptyText}>Cargando categorías…</p>
            </div>
          ) : !error && categories.length === 0 ? (
            <div style={s.emptyState}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5">
                <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
              </svg>
              <p style={s.emptyText}>No hay categorías registradas.</p>
            </div>
          ) : !error ? (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Código</th>
                  <th style={s.th}>Nombre</th>
                  <th style={s.th}>Color</th>
                  <th style={s.th}>Descripción</th>
                  <th style={s.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} style={s.tr}>
                    <td style={s.td}>
                      <span style={s.codeChip}>{cat.code}</span>
                    </td>
                    <td style={s.td}>
                      <span style={s.nameText}>{cat.name}</span>
                    </td>
                    <td style={s.td}>
                      {cat.color_hex ? (
                        <div style={s.colorRow}>
                          <span
                            style={{
                              ...s.colorSwatch,
                              background: cat.color_hex,
                            }}
                            title={cat.color_hex}
                          />
                        </div>
                      ) : (
                        <span style={s.noValue}>Sin color</span>
                      )}
                    </td>
                    <td style={s.td}>
                      <span style={s.descText}>
                        {cat.description ?? <span style={s.noValue}>—</span>}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span
                        style={
                          cat.is_active ? s.badgeActive : s.badgeInactive
                        }
                      >
                        {cat.is_active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>

        <p style={s.hint}>
          Las categorías se asignan a cada edificio al registrarlo. Para agregar nuevas
          categorías, contacta al administrador del sistema.
        </p>
      </div>
    </AdminLayout>
  );
}

const s: Record<string, CSSProperties> = {
  page: { padding: "28px 32px", minHeight: "100%" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 20,
  },
  overline: {
    margin: "0 0 6px",
    fontSize: 11,
    fontWeight: 700,
    color: "#f97316",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  title: { margin: "0 0 6px", fontSize: 28, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.1 },
  subtitle: { margin: 0, fontSize: 14, color: "#64748b" },
  alertError: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 18,
    padding: "12px 15px",
    borderRadius: 10,
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "#fca5a5",
    fontSize: 13.5,
    fontWeight: 500,
  },
  statsRow: {
    display: "flex",
    gap: 16,
    marginBottom: 24,
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "14px 20px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 12,
    minWidth: 90,
  },
  statValue: { fontSize: 24, fontWeight: 700, color: "#f1f5f9", lineHeight: 1 },
  statLabel: { fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" },
  tableWrap: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
  },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: {
    padding: "12px 16px",
    textAlign: "left" as const,
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    borderBottom: "1px solid #334155",
    background: "#0f172a",
  },
  tr: { borderBottom: "1px solid #1e293b" },
  td: { padding: "13px 16px", verticalAlign: "middle" as const },
  codeChip: {
    display: "inline-block",
    padding: "3px 10px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    color: "#94a3b8",
    fontFamily: "monospace",
  },
  nameText: { fontSize: 14, fontWeight: 600, color: "#e2e8f0" },
  colorRow: { display: "flex", alignItems: "center", gap: 8 },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 5,
    border: "1px solid rgba(255,255,255,0.1)",
    flexShrink: 0,
  },
  descText: { fontSize: 13, color: "#94a3b8" },
  noValue: { color: "#475569", fontStyle: "italic" as const, fontSize: 13 },
  badgeActive: {
    display: "inline-block",
    padding: "3px 10px",
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.25)",
    color: "#86efac",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  badgeInactive: {
    display: "inline-block",
    padding: "3px 10px",
    background: "rgba(100,116,139,0.12)",
    border: "1px solid rgba(100,116,139,0.25)",
    color: "#94a3b8",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 10,
    padding: "48px 24px",
  },
  emptyText: { margin: 0, fontSize: 14, color: "#64748b" },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.08)",
    borderTopColor: "#f97316",
    animation: "spin 0.8s linear infinite",
  },
  hint: {
    margin: 0,
    fontSize: 12.5,
    color: "#475569",
    lineHeight: 1.6,
  },
};

