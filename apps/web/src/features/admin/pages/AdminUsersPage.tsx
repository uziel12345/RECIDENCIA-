import type { CSSProperties, FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  createAdminUserApi,
  getAdminUsersApi,
  hasPermission,
  updateAdminUserApi,
  updateAdminUserStatusApi,
  type AdminUser,
  type UserRole,
} from "@ito-map/shared";
import { Navigate } from "react-router-dom";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { ROUTES } from "../../../types/routes";

const roles: UserRole[] = [
  "superadmin",
  "admin",
  "servicios_escolares",
  "recursos_humanos",
  "viewer",
];

type FormState = {
  username: string;
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  is_active: boolean;
};

const emptyForm: FormState = {
  username: "",
  full_name: "",
  email: "",
  password: "",
  role: "admin",
  is_active: true,
};

export function AdminUsersPage() {
  const { user } = useAdminAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canManageAdminUsers = hasPermission(
    user?.role,
    "can_manage_admin_users"
  );

  useEffect(() => {
    if (!canManageAdminUsers) return;
    void loadUsers();
  }, [canManageAdminUsers]);

  if (!canManageAdminUsers) {
    return <Navigate to={ROUTES.ADMIN_BUILDINGS} replace />;
  }

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

  function startEdit(adminUser: AdminUser) {
    setEditingUser(adminUser);
    setForm({
      username: adminUser.username,
      full_name: adminUser.full_name,
      email: adminUser.email,
      password: "",
      role: adminUser.role,
      is_active: adminUser.is_active,
    });
  }

  function cancelEdit() {
    setEditingUser(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (editingUser) {
        const { password, ...input } = form;
        await updateAdminUserApi(editingUser.id, {
          ...input,
          ...(password ? { password } : {}),
        });
        setMessage("Usuario actualizado");
      } else {
        await createAdminUserApi(form);
        setMessage("Usuario creado");
      }

      cancelEdit();
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(adminUser: AdminUser) {
    setError(null);
    setMessage(null);

    try {
      await updateAdminUserStatusApi(adminUser.id, {
        is_active: !adminUser.is_active,
      });
      setMessage("Estado actualizado");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar");
    }
  }

  return (
    <section>
      <header style={styles.header}>
        <div>
          <p style={styles.overline}>Panel administrativo</p>
          <h1 style={styles.pageTitle}>Usuarios admin</h1>
          <p style={styles.text}>Gestiona usuarios y roles del panel.</p>
        </div>
      </header>

      {error ? <div role="alert" style={styles.errorBox}>{error}</div> : null}
      {message ? <div style={styles.successBox}>{message}</div> : null}

      <section style={styles.layout}>
        <form onSubmit={handleSubmit} style={styles.card}>
          <div style={styles.formHeader}>
            <h2 style={styles.sectionTitle}>
              {editingUser ? "Editar usuario" : "Crear usuario"}
            </h2>
            {editingUser ? (
              <button type="button" onClick={cancelEdit} style={styles.secondaryButton}>
                Cancelar
              </button>
            ) : null}
          </div>

          <input required placeholder="Usuario" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} style={styles.input} />
          <input required placeholder="Nombre completo" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} style={styles.input} />
          <input required type="email" placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={styles.input} />
          <input required={!editingUser} type="password" placeholder={editingUser ? "Nueva contrasena opcional" : "Contrasena"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={styles.input} />

          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} style={styles.input}>
            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>

          <label style={styles.checkboxLabel}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Usuario activo
          </label>

          <button type="submit" disabled={saving} style={styles.primaryButton}>
            {saving ? "Guardando..." : editingUser ? "Guardar cambios" : "Crear usuario"}
          </button>
        </form>

        <section style={styles.card}>
          <div style={styles.tableHeader}>
            <h2 style={styles.sectionTitle}>Listado</h2>
            <button type="button" onClick={loadUsers} disabled={loading} style={styles.secondaryButton}>
              {loading ? "Cargando..." : "Recargar"}
            </button>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Usuario</th>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Correo</th>
                  <th style={styles.th}>Rol</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((adminUser) => (
                  <tr key={adminUser.id}>
                    <td style={styles.td}>{adminUser.username}</td>
                    <td style={styles.td}>{adminUser.full_name}</td>
                    <td style={styles.td}>{adminUser.email}</td>
                    <td style={styles.td}>{adminUser.role}</td>
                    <td style={styles.td}>{adminUser.is_active ? "Activo" : "Inactivo"}</td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button type="button" onClick={() => startEdit(adminUser)} style={styles.editButton}>Editar</button>
                        <button type="button" onClick={() => toggleStatus(adminUser)} style={styles.smallButton}>
                          {adminUser.is_active ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 ? (
                  <tr><td style={styles.emptyTd} colSpan={6}>No hay usuarios para mostrar.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "#f8fafc", padding: "28px", color: "#0f172a" },
  header: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", marginBottom: "22px" },
  layout: { display: "grid", gridTemplateColumns: "minmax(320px, 420px) 1fr", gap: "22px", alignItems: "start" },
  pageTitle: { margin: 0, fontSize: "32px", lineHeight: 1.15 },
  overline: { margin: "0 0 8px", color: "#2563eb", fontWeight: 800, fontSize: "14px" },
  text: { margin: "0 0 8px", color: "#64748b", lineHeight: 1.5 },
  card: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "22px", padding: "22px", boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)", overflow: "hidden" },
  formHeader: { display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "center", marginBottom: "14px" },
  tableHeader: { display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", marginBottom: "16px" },
  sectionTitle: { margin: 0, fontSize: "20px" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "14px", padding: "11px 13px", fontSize: "14px", outline: "none", background: "#ffffff", marginBottom: "14px" },
  checkboxLabel: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px", color: "#334155", fontWeight: 700, fontSize: "14px" },
  primaryButton: { width: "100%", border: "none", borderRadius: "14px", padding: "12px 16px", background: "#2563eb", color: "#ffffff", fontWeight: 800, cursor: "pointer" },
  secondaryButton: { border: "1px solid #cbd5e1", borderRadius: "14px", padding: "10px 14px", background: "#ffffff", color: "#0f172a", fontWeight: 800, cursor: "pointer" },
  errorBox: { marginBottom: "16px", padding: "13px 15px", borderRadius: "14px", background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", fontWeight: 700 },
  successBox: { marginBottom: "16px", padding: "13px 15px", borderRadius: "14px", background: "#dcfce7", border: "1px solid #bbf7d0", color: "#166534", fontWeight: 700 },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "820px" },
  th: { textAlign: "left", padding: "12px", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "13px", background: "#f8fafc" },
  td: { padding: "12px", borderBottom: "1px solid #e2e8f0", color: "#0f172a", fontSize: "14px", verticalAlign: "top" },
  emptyTd: { padding: "20px", textAlign: "center", color: "#64748b", borderBottom: "1px solid #e2e8f0" },
  actions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  editButton: { border: "1px solid #bfdbfe", borderRadius: "12px", padding: "8px 10px", background: "#dbeafe", color: "#1d4ed8", fontWeight: 700, cursor: "pointer" },
  smallButton: { border: "1px solid #cbd5e1", borderRadius: "12px", padding: "8px 10px", background: "#ffffff", color: "#0f172a", fontWeight: 700, cursor: "pointer" },
};
