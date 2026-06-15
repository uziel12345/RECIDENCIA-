import type { CSSProperties, FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  ROLE_PERMISSIONS,
  createAdminUserApi,
  getAdminUsersApi,
  updateAdminUserStatusApi,
  type AuthUser,
  type UserRole,
} from "@ito-map/shared";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { AdminLayout } from "../components/AdminLayout";

const ADMIN_ROLES: UserRole[] = [
  "superadmin",
  "admin",
  "servicios_escolares",
  "recursos_humanos",
];

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  servicios_escolares: "Servicios Escolares",
  recursos_humanos: "Recursos Humanos",
  viewer: "Visor",
};

const emptyForm = {
  username: "",
  full_name: "",
  email: "",
  password: "",
  role: "admin" as UserRole,
  is_active: true,
};

export function AdminUsersPage() {
  const { user } = useAdminAuthStore();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const canManageUsers = Boolean(
    user && ROLE_PERMISSIONS[user.role]?.can_manage_admin_users
  );

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      setUsers(await getAdminUsersApi());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(target: AuthUser) {
    setActionId(target.id);
    setError(null);
    try {
      const updated = await updateAdminUserStatusApi(target.id, !target.is_active);
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setSuccess(`Usuario ${updated.is_active ? "activado" : "desactivado"} correctamente.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar usuario");
    } finally {
      setActionId(null);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await createAdminUserApi(form);
      setForm(emptyForm);
      setSuccess("Usuario creado correctamente.");
      setTimeout(() => setSuccess(null), 3000);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear usuario");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <AdminLayout>
      <div style={s.page}>
        <header style={s.header}>
          <div>
            <p style={s.overline}>Administración</p>
            <h1 style={s.title}>Usuarios</h1>
            <p style={s.subtitle}>Gestiona los administradores del sistema.</p>
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

        {success ? (
          <div style={s.alertSuccess}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {success}
          </div>
        ) : null}

        {canManageUsers ? (
          <form onSubmit={handleCreate} style={s.formCard}>
            <h2 style={s.cardTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              Crear administrador
            </h2>
            <div style={s.formGrid}>
              <Field label="Usuario">
                <input
                  required
                  minLength={3}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="usuario123"
                  style={s.input}
                />
              </Field>
              <Field label="Nombre completo">
                <input
                  required
                  minLength={3}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Nombre Apellido"
                  style={s.input}
                />
              </Field>
              <Field label="Correo electrónico">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="correo@ito.edu.mx"
                  style={s.input}
                />
              </Field>
              <Field label="Contraseña (mín. 12 chars)">
                <input
                  required
                  minLength={12}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Contraseña segura"
                  style={s.input}
                />
              </Field>
              <Field label="Rol">
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  style={s.input}
                >
                  {ADMIN_ROLES.map((role) => (
                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                  ))}
                </select>
              </Field>
              <div style={s.checkboxField}>
                <label style={s.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    style={s.checkbox}
                  />
                  <span>Usuario activo al crear</span>
                </label>
              </div>
            </div>
            <button type="submit" disabled={creating} style={s.btnPrimary}>
              {creating ? "Creando..." : "Crear usuario"}
            </button>
          </form>
        ) : null}

        <div style={s.tableCard}>
          <div style={s.tableHeader}>
            <h2 style={s.cardTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              Administradores
            </h2>
            <button type="button" onClick={loadUsers} disabled={loading} style={s.btnSecondary}>
              {loading ? "Cargando..." : "Actualizar"}
            </button>
          </div>

          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Usuario", "Nombre", "Correo", "Rol", "Estado", ""].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={s.tr}>
                    <td style={s.td}>
                      <span style={s.userChip}>{u.username[0]?.toUpperCase()}</span>
                      {u.username}
                    </td>
                    <td style={s.td}>{u.full_name}</td>
                    <td style={{ ...s.td, color: "#64748b" }}>{u.email}</td>
                    <td style={s.td}>
                      <span style={s.roleBadge}>{ROLE_LABELS[u.role] ?? u.role}</span>
                    </td>
                    <td style={s.td}>
                      <span style={u.is_active ? s.statusActive : s.statusInactive}>
                        <span style={u.is_active ? s.dotActive : s.dotInactive} />
                        {u.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={s.tdAction}>
                      <button
                        type="button"
                        onClick={() => void handleToggle(u)}
                        disabled={actionId === u.id}
                        style={u.is_active ? s.btnDeactivate : s.btnActivate}
                      >
                        {actionId === u.id
                          ? "..."
                          : u.is_active
                          ? "Desactivar"
                          : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={s.emptyTd}>
                      {loading ? "Cargando..." : "No hay usuarios registrados."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={sf.field}>
      <span style={sf.label}>{label}</span>
      {children}
    </label>
  );
}

const s: Record<string, CSSProperties> = {
  page: { padding: "28px 32px", minHeight: "100%" },
  header: { marginBottom: 28 },
  overline: { margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.08em" },
  title: { margin: "0 0 6px", fontSize: 28, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.1 },
  subtitle: { margin: 0, fontSize: 14, color: "#64748b" },
  alertError: { display: "flex", alignItems: "center", gap: 9, marginBottom: 18, padding: "12px 15px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 13.5, fontWeight: 500 },
  alertSuccess: { display: "flex", alignItems: "center", gap: 9, marginBottom: 18, padding: "12px 15px", borderRadius: 10, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#86efac", fontSize: 13.5, fontWeight: 500 },
  formCard: { background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: "22px 24px", marginBottom: 22 },
  tableCard: { background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: "22px 24px" },
  cardTitle: { margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9", display: "flex", alignItems: "center", gap: 8 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "18px 0" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #334155", borderRadius: 10, padding: "9px 12px", fontSize: 13.5, background: "#0f172a", color: "#f1f5f9", outline: "none" },
  checkboxField: { display: "flex", alignItems: "flex-end", paddingBottom: 2 },
  checkboxLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#94a3b8", cursor: "pointer" },
  checkbox: { width: 16, height: 16, accentColor: "#f97316" },
  tableHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 720 },
  th: { textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #334155", color: "#475569", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: "#161f2e" },
  tr: { borderBottom: "1px solid #243147" },
  td: { padding: "12px 14px", fontSize: 13.5, color: "#cbd5e1", display: undefined },
  tdAction: { padding: "12px 14px", textAlign: "right" },
  emptyTd: { padding: "28px", textAlign: "center", color: "#475569", fontSize: 14 },
  userChip: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 6, background: "rgba(234,88,12,0.15)", color: "#60a5fa", fontSize: 11, fontWeight: 700, marginRight: 8 },
  roleBadge: { display: "inline-block", padding: "3px 9px", borderRadius: 99, background: "rgba(234,88,12,0.1)", border: "1px solid rgba(234,88,12,0.2)", color: "#fdba74", fontSize: 11.5, fontWeight: 600 },
  statusActive: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#86efac", fontWeight: 600 },
  statusInactive: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#94a3b8", fontWeight: 500 },
  dotActive: { width: 6, height: 6, borderRadius: "50%", background: "#22c55e" },
  dotInactive: { width: 6, height: 6, borderRadius: "50%", background: "#475569" },
  btnPrimary: { border: "none", borderRadius: 10, padding: "10px 20px", background: "#f97316", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13.5 },
  btnSecondary: { border: "1px solid #334155", borderRadius: 10, padding: "8px 16px", background: "transparent", color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: 13 },
  btnActivate: { border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "6px 12px", background: "rgba(34,197,94,0.08)", color: "#86efac", fontWeight: 600, cursor: "pointer", fontSize: 12.5 },
  btnDeactivate: { border: "1px solid #334155", borderRadius: 8, padding: "6px 12px", background: "transparent", color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: 12.5 },
};

const sf: Record<string, CSSProperties> = {
  field: { display: "grid", gap: 6 },
  label: { fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" },
};


