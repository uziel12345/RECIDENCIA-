import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  createBuildingApi,
  deleteBuildingApi,
  getAdminBuildingsPaginatedApi,
  getCategoriesApi,
  updateBuildingApi,
  updateBuildingStatusApi,
  type Building,
  type BuildingCategory,
  type CreateBuildingInput,
  type UpdateBuildingInput,
} from "@ito-map/shared";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { BuildingImagesModal } from "../components/BuildingImagesModal";

type BuildingFormState = {
  code: string;
  name: string;
  slug: string;
  description: string;
  model_node_name: string;
  x: string;
  y: string;
  z: string;
  latitude: string;
  longitude: string;
  category_code: string;
  is_priority: boolean;
};

const initialFormState: BuildingFormState = {
  code: "",
  name: "",
  slug: "",
  description: "",
  model_node_name: "",
  x: "",
  y: "",
  z: "",
  latitude: "",
  longitude: "",
  category_code: "",
  is_priority: false,
};

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) return null;

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function numberToFormValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function mapBuildingToForm(building: Building): BuildingFormState {
  return {
    code: safeText(building.code),
    name: safeText(building.name),
    slug: safeText(building.slug),
    description: safeText(building.description),
    model_node_name: safeText(building.model_node_name),
    x: numberToFormValue(building.x),
    y: numberToFormValue(building.y),
    z: numberToFormValue(building.z),
    latitude: numberToFormValue(building.latitude),
    longitude: numberToFormValue(building.longitude),
    category_code: safeText(building.category_code),
    is_priority: Boolean(building.is_priority),
  };
}

function buildCreateInput(form: BuildingFormState): CreateBuildingInput {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    slug: form.slug.trim() || createSlug(form.name),
    description: form.description.trim() || null,
    model_node_name: form.model_node_name.trim(),
    x: toNullableNumber(form.x),
    y: toNullableNumber(form.y),
    z: toNullableNumber(form.z),
    latitude: toNullableNumber(form.latitude),
    longitude: toNullableNumber(form.longitude),
    category_code: form.category_code.trim(),
    is_active: true,
    is_priority: form.is_priority,
  };
}

function buildUpdateInput(
  form: BuildingFormState,
  currentBuilding: Building
): UpdateBuildingInput {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    slug: form.slug.trim() || createSlug(form.name),
    description: form.description.trim() || null,
    model_node_name: form.model_node_name.trim(),
    x: toNullableNumber(form.x),
    y: toNullableNumber(form.y),
    z: toNullableNumber(form.z),
    latitude: toNullableNumber(form.latitude),
    longitude: toNullableNumber(form.longitude),
    category_code: form.category_code.trim(),
    is_active: Boolean(currentBuilding.is_active),
    is_priority: form.is_priority,
  };
}

export function AdminBuildingsPage() {
  const { logout, user } = useAdminAuthStore();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [categories, setCategories] = useState<BuildingCategory[]>([]);
  const [form, setForm] = useState<BuildingFormState>(initialFormState);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [imageModalBuilding, setImageModalBuilding] =
    useState<Building | null>(null);

  const isEditing = editingBuilding !== null;

  const limit = 10;

  const filteredBuildings = buildings;

  useEffect(() => {
    void loadBuildings();
    void loadCategories();
  }, [page]);

  async function loadCategories() {
    try {
      const data = await getCategoriesApi();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  }

  async function loadBuildings() {
    setLoadingBuildings(true);
    setError(null);

    try {
      const response = await getAdminBuildingsPaginatedApi(page, limit);
      const payload = response as any;

      const data: Building[] = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      setBuildings(data);
      setTotalPages(payload?.pagination?.totalPages ?? 1);
      setTotalRecords(payload?.pagination?.total ?? data.length);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los edificios";

      setError(msg);
      setBuildings([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoadingBuildings(false);
    }
  }

  function updateFormField<K extends keyof BuildingFormState>(
    key: K,
    value: BuildingFormState[K]
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function handleNameChange(value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      name: value,
      slug: currentForm.slug ? currentForm.slug : createSlug(value),
    }));
  }

  function handleStartEdit(building: Building) {
    setEditingBuilding(building);
    setForm(mapBuildingToForm(building));
    setError(null);
    setMessage(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleCancelEdit() {
    setEditingBuilding(null);
    setForm(initialFormState);
    setError(null);
    setMessage(null);
  }

  async function handleSubmitBuilding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (editingBuilding) {
        const input = buildUpdateInput(form, editingBuilding);
        await updateBuildingApi(editingBuilding.id, input);

        setMessage("Edificio actualizado correctamente.");
        setEditingBuilding(null);
      } else {
        const input = buildCreateInput(form);
        await createBuildingApi(input);

        setMessage("Edificio creado correctamente.");
      }

      setForm(initialFormState);
      await loadBuildings();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : isEditing
            ? "No se pudo actualizar el edificio"
            : "No se pudo crear el edificio";

      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(building: Building) {
    setActionLoadingId(building.id);
    setError(null);
    setMessage(null);

    const nextStatus = !Boolean(building.is_active);

    try {
      await updateBuildingStatusApi(building.id, {
        is_active: nextStatus,
      });

      setMessage(
        nextStatus
          ? "Edificio activado correctamente."
          : "Edificio desactivado correctamente."
      );

      if (editingBuilding?.id === building.id) {
        setEditingBuilding(null);
        setForm(initialFormState);
      }

      await loadBuildings();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No se pudo cambiar el estado";

      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(building: Building) {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar "${safeText(
        building.name
      )}"? Se hará soft delete.`
    );

    if (!confirmed) return;

    setActionLoadingId(building.id);
    setError(null);
    setMessage(null);

    try {
      await deleteBuildingApi(building.id);
      setMessage("Edificio eliminado correctamente.");

      if (editingBuilding?.id === building.id) {
        setEditingBuilding(null);
        setForm(initialFormState);
      }

      await loadBuildings();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No se pudo eliminar el edificio";

      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleLogout() {
    logout();
    window.location.href = "/admin/login";
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.overline}>Panel administrativo</p>
          <h1 style={styles.pageTitle}>Edificios</h1>
          <p style={styles.text}>
            Administra los edificios visibles y ocultos del mapa interactivo del
            ITO.
          </p>

          {user ? (
            <p style={styles.userText}>
              Sesión activa:{" "}
              <strong>
                {user.full_name || user.username || "Administrador"}
              </strong>
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={styles.secondaryButton}
        >
          Cerrar sesión
        </button>
      </header>

      {error ? (
        <div role="alert" style={styles.errorBox}>
          {error}
        </div>
      ) : null}

      {message ? <div style={styles.successBox}>{message}</div> : null}

      <section style={styles.layout}>
        <form onSubmit={handleSubmitBuilding} style={styles.formCard}>
          <div style={styles.formHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {isEditing ? "Editar edificio" : "Crear edificio"}
              </h2>

              {isEditing ? (
                <p style={styles.text}>
                  Editando: <strong>{safeText(editingBuilding?.name)}</strong>
                </p>
              ) : (
                <p style={styles.text}>
                  Registra un nuevo edificio para el mapa interactivo.
                </p>
              )}
            </div>

            {isEditing ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={styles.cancelButton}
              >
                Cancelar
              </button>
            ) : null}
          </div>

          <div style={styles.grid}>
            <label style={styles.label}>
              Código
              <input
                value={form.code}
                onChange={(event) => updateFormField("code", event.target.value)}
                required
                style={styles.input}
                placeholder="EDIF-A"
              />
            </label>

            <label style={styles.label}>
              Nombre
              <input
                value={form.name}
                onChange={(event) => handleNameChange(event.target.value)}
                required
                style={styles.input}
                placeholder="Edificio A"
              />
            </label>

            <label style={styles.label}>
              Slug
              <input
                value={form.slug}
                onChange={(event) => updateFormField("slug", event.target.value)}
                required
                style={styles.input}
                placeholder="edificio-a"
              />
            </label>

            <label style={styles.label}>
              Categoría
              <select
                value={form.category_code}
                onChange={(event) =>
                  updateFormField("category_code", event.target.value)
                }
                required
                style={styles.input}
              >
                <option value="">Seleccionar...</option>
                {categories
                  .filter((c) => Boolean(c.is_active))
                  .map((cat) => (
                    <option key={cat.id} value={cat.code}>
                      {cat.name} ({cat.code})
                    </option>
                  ))}
              </select>
            </label>

            <label style={styles.label}>
              Nodo del modelo 3D
              <input
                value={form.model_node_name}
                onChange={(event) =>
                  updateFormField("model_node_name", event.target.value)
                }
                required
                style={styles.input}
                placeholder="Building_A"
              />
            </label>

            <label style={styles.label}>
              X
              <input
                value={form.x}
                onChange={(event) => updateFormField("x", event.target.value)}
                style={styles.input}
                placeholder="0"
              />
            </label>

            <label style={styles.label}>
              Y
              <input
                value={form.y}
                onChange={(event) => updateFormField("y", event.target.value)}
                style={styles.input}
                placeholder="0"
              />
            </label>

            <label style={styles.label}>
              Z
              <input
                value={form.z}
                onChange={(event) => updateFormField("z", event.target.value)}
                style={styles.input}
                placeholder="0"
              />
            </label>

            <label style={styles.label}>
              Latitud
              <input
                value={form.latitude}
                onChange={(event) =>
                  updateFormField("latitude", event.target.value)
                }
                style={styles.input}
                placeholder="17.073"
              />
            </label>

            <label style={styles.label}>
              Longitud
              <input
                value={form.longitude}
                onChange={(event) =>
                  updateFormField("longitude", event.target.value)
                }
                style={styles.input}
                placeholder="-96.726"
              />
            </label>
          </div>

          <label style={styles.label}>
            Descripción
            <textarea
              value={form.description}
              onChange={(event) =>
                updateFormField("description", event.target.value)
              }
              style={{
                ...styles.input,
                minHeight: "90px",
                resize: "vertical",
              }}
              placeholder="Descripción breve del edificio"
            />
          </label>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.is_priority}
              onChange={(event) =>
                updateFormField("is_priority", event.target.checked)
              }
            />
            Marcar como edificio prioritario
          </label>

          <button type="submit" disabled={saving} style={styles.primaryButton}>
            {saving
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear edificio"}
          </button>
        </form>

        <section style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Listado</h2>
              <p style={styles.text}>
                Mostrando {buildings.length} de {totalRecords} edificios.
              </p>
            </div>

            <button
              type="button"
              onClick={loadBuildings}
              disabled={loadingBuildings}
              style={styles.secondaryButton}
            >
              {loadingBuildings ? "Cargando..." : "Recargar"}
            </button>
          </div>

          <div style={styles.filters}>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={styles.searchInput}
              placeholder="Buscar por nombre, código o categoría"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | "active" | "inactive"
                )
              }
              style={styles.select}
            >
              <option value="all">Todos</option>
              <option value="active">Solo activos</option>
              <option value="inactive">Solo inactivos</option>
            </select>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Código</th>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Categoría</th>
                  <th style={styles.th}>Modelo 3D</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredBuildings.map((building) => {
                  const isActive = Boolean(building.is_active);
                  const isCurrentEdit = editingBuilding?.id === building.id;

                  return (
                    <tr
                      key={building.id}
                      style={
                        isCurrentEdit
                          ? styles.editingRow
                          : !isActive
                            ? styles.inactiveRow
                            : undefined
                      }
                    >
                      <td style={styles.td}>{safeText(building.code)}</td>
                      <td style={styles.td}>{safeText(building.name)}</td>
                      <td style={styles.td}>
                        {safeText(building.category_name) || "Sin categoría"}
                      </td>
                      <td style={styles.td}>
                        {safeText(building.model_node_name) || "Sin nodo"}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={
                            isActive ? styles.activeBadge : styles.inactiveBadge
                          }
                        >
                          {isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(building)}
                            disabled={actionLoadingId === building.id}
                            style={styles.editButton}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => setImageModalBuilding(building)}
                            disabled={actionLoadingId === building.id}
                            style={styles.photoButton}
                          >
                            Fotos
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(building)}
                            disabled={actionLoadingId === building.id}
                            style={styles.smallButton}
                          >
                            {isActive ? "Desactivar" : "Activar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(building)}
                            disabled={actionLoadingId === building.id}
                            style={styles.dangerButton}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredBuildings.length === 0 ? (
                  <tr>
                    <td style={styles.emptyTd} colSpan={6}>
                      No hay edificios para mostrar.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={styles.pageButton}
            >
              Anterior
            </button>

            <span style={styles.pageInfo}>
              Página {page} de {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={styles.pageButton}
            >
              Siguiente
            </button>
          </div>
        </section>
      </section>

      {imageModalBuilding ? (
        <BuildingImagesModal
          building={imageModalBuilding}
          onClose={() => setImageModalBuilding(null)}
        />
      ) : null}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 440px) 1fr",
    gap: "22px",
    alignItems: "start",
  },
  formCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
  },
  tableCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  pageTitle: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.15,
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: "20px",
  },
  overline: {
    margin: "0 0 8px",
    color: "#2563eb",
    fontWeight: 800,
    fontSize: "14px",
  },
  text: {
    margin: "0 0 8px",
    color: "#64748b",
    lineHeight: 1.5,
  },
  userText: {
    margin: "8px 0 0",
    color: "#334155",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginBottom: "14px",
    color: "#334155",
    fontWeight: 700,
    fontSize: "14px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
    color: "#334155",
    fontWeight: 700,
    fontSize: "14px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "11px 13px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "1fr 180px",
    gap: "12px",
    marginBottom: "16px",
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "11px 13px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "11px 13px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
  },
  primaryButton: {
    width: "100%",
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
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
  cancelButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "9px 12px",
    background: "#f8fafc",
    color: "#334155",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  editButton: {
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "8px 10px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 700,
    cursor: "pointer",
  },
  photoButton: {
    border: "1px solid #c7d2fe",
    borderRadius: "12px",
    padding: "8px 10px",
    background: "#e0e7ff",
    color: "#3730a3",
    fontWeight: 700,
    cursor: "pointer",
  },
  smallButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "8px 10px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
  },
  dangerButton: {
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "8px 10px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 700,
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
  successBox: {
    marginBottom: "16px",
    padding: "13px 15px",
    borderRadius: "14px",
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontWeight: 700,
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "16px",
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
    verticalAlign: "top",
  },
  emptyTd: {
    padding: "20px",
    textAlign: "center",
    color: "#64748b",
    borderBottom: "1px solid #e2e8f0",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  inactiveRow: {
    background: "#f8fafc",
    opacity: 0.82,
  },
  editingRow: {
    background: "#eff6ff",
  },
  activeBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 800,
    fontSize: "12px",
  },
  inactiveBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 800,
    fontSize: "12px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    marginTop: "18px",
    paddingTop: "14px",
    borderTop: "1px solid #e2e8f0",
  },
  pageButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "8px 14px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
  },
  pageInfo: {
    color: "#475569",
    fontWeight: 700,
    fontSize: "14px",
  },
};
