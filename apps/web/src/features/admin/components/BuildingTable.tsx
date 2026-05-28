import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { Building } from "@ito-map/shared";
import type { AdminBuildingStatusFilter } from "../hooks/useAdminBuildings";
import { safeText } from "../hooks/useBuildingForm";

type BuildingTableProps = {
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
  canEditBuildings: boolean;
  canEditPhotos: boolean;
  canEditNavigation: boolean;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: AdminBuildingStatusFilter) => void;
  onPageChange: Dispatch<SetStateAction<number>>;
  onRefresh: () => void | Promise<void>;
  onStartEdit: (building: Building) => void;
  onOpenImages: (building: Building) => void;
  onToggleStatus: (building: Building) => void | Promise<void>;
  onDelete: (building: Building) => void | Promise<void>;
};

export function BuildingTable({
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
  canEditBuildings,
  canEditPhotos,
  canEditNavigation,
  onSearchTermChange,
  onStatusFilterChange,
  onPageChange,
  onRefresh,
  onStartEdit,
  onOpenImages,
  onToggleStatus,
  onDelete,
}: BuildingTableProps) {
  return (
    <section style={styles.tableCard}>
      <div style={styles.tableHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Listado</h2>
          <p style={styles.text}>
            Mostrando {buildings.length} de {totalRecords} edificios.
          </p>
        </div>

        <div style={styles.tableHeaderActions}>
          {canEditNavigation ? (
            <a href="/admin/navigation" style={styles.primaryLink}>
              Mapa de navegacion
            </a>
          ) : null}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loadingBuildings}
            style={styles.secondaryButton}
          >
            {loadingBuildings ? "Cargando..." : "Recargar"}
          </button>
        </div>
      </div>

      <div style={styles.filters}>
        <input
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          style={styles.searchInput}
          placeholder="Buscar por nombre, código o categoría"
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
              <th style={styles.th}>Código</th>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Categoría</th>
              <th style={styles.th}>Modelo 3D</th>
              <th style={styles.th}>Estado</th>
              {canEditBuildings || canEditPhotos ? (
                <th style={styles.th}>Acciones</th>
              ) : null}
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
                  {canEditBuildings || canEditPhotos ? (
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

                        {canEditPhotos ? (
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
                <td
                  style={styles.emptyTd}
                  colSpan={canEditBuildings || canEditPhotos ? 6 : 5}
                >
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
          Página {page} de {totalPages}
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
  text: {
    margin: "0 0 8px",
    color: "#64748b",
    lineHeight: 1.5,
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
  primaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #1d4ed8",
    borderRadius: "14px",
    padding: "10px 14px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
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
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  tableHeaderActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
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
