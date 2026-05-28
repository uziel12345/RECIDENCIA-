import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import {
  ROLE_PERMISSIONS,
  createAdminUserApi,
  getAdminUsersApi,
  updateAdminUserStatusApi,
  type AuthUser,
  type UserRole,
} from "@ito-map/shared";
import { useNavigate } from "react-router-dom";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { ROUTES } from "../../../types/routes";

const adminRoles: UserRole[] = [
  "superadmin",
  "admin",
  "servicios_escolares",
  "recursos_humanos",
];

const emptyForm = {
  username: "",
  full_name: "",
  email: "",
  password: "",
  role: "admin" as UserRole,
  is_active: true,
};

export function AdminUsersPage() {
  const { logout, user } = useAdminAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  async function handleToggle(user: AuthUser) {
    setActionId(user.id);
    setError(null);

    try {
      const updated = await updateAdminUserStatusApi(user.id, !user.is_active);
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
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
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear usuario");
    } finally {
      setCreating(false);
    }
  }

  function handleLogout() {
    logout();
    void navigate(ROUTES.ADMIN_LOGIN, { replace: true });
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.overline}>Panel administrativo</p>
          <h1 style={styles.pageTitle}>Usuarios</h1>
        </div>

        <div style={styles.headerActions}>
          <button type="button" onClick={() => navigate(ROUTES.ADMIN_BUILDINGS)} style={styles.secondaryButton}>
            Edificios
          </button>
          <button type="button" onClick={handleLogout} style={styles.secondaryButton}>
            Cerrar sesion
          </button>
        </div>
      </header>

      {error ? <div role="alert" style={styles.errorBox}>{error}</div> : null}

      {canManageUsers ? (
        <form onSubmit={handleCreate} style={styles.formCard}>
          <h2 style={styles.sectionTitle}>Crear administrador</h2>
          <div style={styles.formGrid}>
            <label style={styles.label}>
              Usuario
              <input
                required
                minLength={3}
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                style={styles.input}
              />
            </label>
            <label style={styles.label}>
              Nombre completo
              <input
                required
                minLength={3}
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                style={styles.input}
              />
            </label>
            <label style={styles.label}>
              Correo
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                style={styles.input}
              />
            </label>
            <label style={styles.label}>
              Contraseña
              <input
                required
                minLength={6}
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                style={styles.input}
              />
            </label>
            <label style={styles.label}>
              Rol
              <select
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value as UserRole })
                }
                style={styles.input}
              >
                {adminRoles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              />
              Usuario activo
            </label>
          </div>
          <button type="submit" disabled={creating} style={styles.primaryButton}>
            {creating ? "Creando..." : "Crear usuario"}
          </button>
        </form>
      ) : null}

      <section style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <h2 style={styles.sectionTitle}>Administradores</h2>
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
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={styles.td}>{user.username}</td>
                  <td style={styles.td}>{user.full_name}</td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>{user.role}</td>
                  <td style={styles.td}>{user.is_active ? "Activo" : "Inactivo"}</td>
                  <td style={styles.td}>
                    <button
                      type="button"
                      onClick={() => handleToggle(user)}
                      disabled={actionId === user.id}
                      style={styles.secondaryButton}
                    >
                      {user.is_active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td style={styles.emptyTd} colSpan={6}>
                    No hay usuarios para mostrar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "28px",
    color: "#0f172a",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    marginBottom: "22px",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  overline: {
    margin: "0 0 8px",
    color: "#2563eb",
    fontWeight: 800,
    fontSize: "14px",
  },
  pageTitle: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.15,
  },
  tableCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
  },
  formCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "18px",
    boxShadow: "0 10px 26px rgba(15, 23, 42, 0.06)",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    margin: "16px 0",
  },
  label: {
    display: "grid",
    gap: "6px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 800,
  },
  checkboxLabel: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 800,
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "10px 12px",
    fontSize: "14px",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "820px",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: "13px",
    background: "#f8fafc",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    color: "#0f172a",
    fontSize: "14px",
  },
  emptyTd: {
    padding: "20px",
    textAlign: "center",
    color: "#64748b",
    borderBottom: "1px solid #e2e8f0",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "10px 14px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
  },
  primaryButton: {
    border: "1px solid #1d4ed8",
    borderRadius: "14px",
    padding: "10px 14px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },
  errorBox: {
    marginBottom: "16px",
    padding: "13px 15px",
    borderRadius: "14px",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontWeight: 700,
  },
};
