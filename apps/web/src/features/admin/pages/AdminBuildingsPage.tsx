import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { hasPermission, type Building } from "@ito-map/shared";
import { useAdminAuthStore } from "../../../store/admin-auth-store";
import { BuildingForm } from "../components/BuildingForm";
import { BuildingImagesModal } from "../components/BuildingImagesModal";
import {
  type AdminBuildingStatusFilter,
  useAdminBuildings,
} from "../hooks/useAdminBuildings";
import { safeText } from "../hooks/useBuildingForm";

export function AdminBuildingsPage() {
  const { user } = useAdminAuthStore();
  const canEditBuildings = hasPermission(user?.role, "can_edit_buildings");
  const canEditBuildingImages = hasPermission(
    user?.role,
    "can_edit_building_images"
  );

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

  return (
    <section>
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

      </header>

      {error ? (
        <div role="alert" style={styles.errorBox}>
          {error}
        </div>
      ) : null}

      {message ? <div style={styles.successBox}>{message}</div> : null}

      <section
        style={{
          ...styles.layout,
          gridTemplateColumns: canEditBuildings
            ? "minmax(320px, 440px) 1fr"
            : "1fr",
        }}
      >
        {canEditBuildings ? (
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
        ) : null}

        <PermissionedBuildingTable
          buildings={buildings}
          filteredBuildings={filteredBuildings}
          editingBuilding={editingBuilding}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          loadingBuildings={loadingBuildings}
          actionLoadingId={actionLoadingId}
          page={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onSearchTermChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onPageChange={setPage}
          onRefresh={loadBuildings}
          onStartEdit={handleStartEdit}
          onOpenImages={setImageModalBuilding}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          canEditBuildings={canEditBuildings}
          canEditBuildingImages={canEditBuildingImages}
        />
      </section>

      {imageModalBuilding ? (
        <BuildingImagesModal
          building={imageModalBuilding}
          onClose={() => setImageModalBuilding(null)}
        />
      ) : null}
    </section>
  );
}

type PermissionedBuildingTableProps = {
  buildings: Building[];
  filteredBuildings: Building[];
  editingBuilding: Building | null;
  searchTerm: string;
  statusFilter: AdminBuildingStatusFilter;
  loadingBuildings: boolean;
  actionLoadingId: string | null;
  page: number;
  totalPages: number;
  totalRecords: number;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: AdminBuildingStatusFilter) => void;
  onPageChange: Dispatch<SetStateAction<number>>;
  onRefresh: () => void | Promise<void>;
  onStartEdit: (building: Building) => void;
  onOpenImages: (building: Building) => void;
  onToggleStatus: (building: Building) => void | Promise<void>;
  onDelete: (building: Building) => void | Promise<void>;
  canEditBuildings: boolean;
  canEditBuildingImages: boolean;
};

function PermissionedBuildingTable({
  buildings,
  filteredBuildings,
  editingBuilding,
  searchTerm,
  statusFilter,
  loadingBuildings,
  actionLoadingId,
  page,
  totalPages,
  totalRecords,
  onSearchTermChange,
  onStatusFilterChange,
  onPageChange,
  onRefresh,
  onStartEdit,
  onOpenImages,
  onToggleStatus,
  onDelete,
  canEditBuildings,
  canEditBuildingImages,
}: PermissionedBuildingTableProps) {
  const showActions = canEditBuildings || canEditBuildingImages;

  return (
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
          onClick={onRefresh}
          disabled={loadingBuildings}
          style={styles.secondaryButton}
        >
          {loadingBuildings ? "Cargando..." : "Recargar"}
        </button>
      </div>

      <div style={styles.filters}>
        <input
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          style={styles.searchInput}
          placeholder="Buscar por nombre, codigo o categoria"
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as AdminBuildingStatusFilter)
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
              <th style={styles.th}>Codigo</th>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Categoria</th>
              <th style={styles.th}>Modelo 3D</th>
              <th style={styles.th}>Estado</th>
              {showActions ? <th style={styles.th}>Acciones</th> : null}
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
                    {safeText(building.category_name) || "Sin categoria"}
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
                  {showActions ? (
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        {canEditBuildings ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onStartEdit(building)}
                              disabled={actionLoadingId === building.id}
                              style={styles.editButton}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => onToggleStatus(building)}
                              disabled={actionLoadingId === building.id}
                              style={styles.smallButton}
                            >
                              {isActive ? "Desactivar" : "Activar"}
                            </button>

                            <button
                              type="button"
                              onClick={() => onDelete(building)}
                              disabled={actionLoadingId === building.id}
                              style={styles.dangerButton}
                            >
                              Eliminar
                            </button>
                          </>
                        ) : null}

                        {canEditBuildingImages ? (
                          <button
                            type="button"
                            onClick={() => onOpenImages(building)}
                            disabled={actionLoadingId === building.id}
                            style={styles.photoButton}
                          >
                            Fotos
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}

            {filteredBuildings.length === 0 ? (
              <tr>
                <td style={styles.emptyTd} colSpan={showActions ? 6 : 5}>
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
            onPageChange((currentPage) => Math.max(1, currentPage - 1))
          }
          disabled={page <= 1}
          style={styles.pageButton}
        >
          Anterior
        </button>

        <span style={styles.pageInfo}>
          Pagina {page} de {totalPages}
        </span>

        <button
          type="button"
          onClick={() =>
            onPageChange((currentPage) =>
              Math.min(totalPages, currentPage + 1)
            )
          }
          disabled={page >= totalPages}
          style={styles.pageButton}
        >
          Siguiente
        </button>
      </div>
    </section>
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
  pageTitle: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.15,
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
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "10px 14px",
    background: "#ffffff",
    color: "#0f172a",
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
  successBox: {
    marginBottom: "16px",
    padding: "13px 15px",
    borderRadius: "14px",
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontWeight: 700,
  },
  tableCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: "20px",
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
