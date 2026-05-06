import type { CSSProperties } from "react";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { BuildingForm } from "../components/BuildingForm";
import { BuildingImagesModal } from "../components/BuildingImagesModal";
import {
  useAdminBuildings,
  type AdminBuildingStatusFilter,
} from "../hooks/useAdminBuildings";
import { safeText } from "../hooks/useBuildingForm";

export function AdminBuildingsPage() {
  const { logout, user } = useAdminAuthStore();

  const {
    buildings,
    categories,
    form,
    editingBuilding,
    searchTerm,
    statusFilter,
    loadingBuildings,
    saving,
    actionLoadingId,
    error,
    message,
    page,
    totalPages,
    totalRecords,
    imageModalBuilding,
    isEditing,
    filteredBuildings,
    setSearchTerm,
    setStatusFilter,
    setPage,
    setImageModalBuilding,
    loadBuildings,
    updateFormField,
    handleNameChange,
    handleStartEdit,
    handleCancelEdit,
    handleSubmitBuilding,
    handleToggleStatus,
    handleDelete,
  } = useAdminBuildings();

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
        <BuildingForm
          form={form}
          categories={categories}
          isEditing={isEditing}
          editingBuildingName={safeText(editingBuilding?.name)}
          saving={saving}
          onSubmit={handleSubmitBuilding}
          onCancelEdit={handleCancelEdit}
          onNameChange={handleNameChange}
          onUpdateFormField={updateFormField}
        />

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
                setStatusFilter(event.target.value as AdminBuildingStatusFilter)
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
              onClick={() =>
                setPage((currentPage) => Math.max(1, currentPage - 1))
              }
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
              onClick={() =>
                setPage((currentPage) => Math.min(totalPages, currentPage + 1))
              }
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
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 440px) 1fr",
    gap: "22px",
    alignItems: "start",
  },
  tableCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
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
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "10px 14px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
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