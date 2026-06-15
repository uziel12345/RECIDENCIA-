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
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
    overflow: "hidden",
  },
  sectionTitle: {
    margin: "0 0 4px",
    fontSize: "18px",
    fontWeight: 700,
    color: "#f1f5f9",
  },
  text: {
    margin: "0 0 8px",
    color: "#64748b",
    lineHeight: 1.5,
    fontSize: "13px",
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
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "9px 13px",
    fontSize: "13.5px",
    outline: "none",
    background: "#0f172a",
    color: "#e2e8f0",
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "9px 13px",
    fontSize: "13.5px",
    outline: "none",
    background: "#0f172a",
    color: "#e2e8f0",
    fontWeight: 600,
  },
  secondaryButton: {
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "9px 14px",
    background: "transparent",
    color: "#94a3b8",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "13px",
  },
  primaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(234,88,12,0.4)",
    borderRadius: "10px",
    padding: "9px 14px",
    background: "rgba(234,88,12,0.15)",
    color: "#fdba74",
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
    fontSize: "13px",
  },
  editButton: {
    border: "1px solid rgba(234,88,12,0.3)",
    borderRadius: "8px",
    padding: "6px 10px",
    background: "rgba(234,88,12,0.1)",
    color: "#fdba74",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "12.5px",
  },
  photoButton: {
    border: "1px solid rgba(139,92,246,0.3)",
    borderRadius: "8px",
    padding: "6px 10px",
    background: "rgba(139,92,246,0.1)",
    color: "#c4b5fd",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "12.5px",
  },
  smallButton: {
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "6px 10px",
    background: "transparent",
    color: "#94a3b8",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "12.5px",
  },
  dangerButton: {
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "8px",
    padding: "6px 10px",
    background: "rgba(239,68,68,0.08)",
    color: "#fca5a5",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "12.5px",
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
    padding: "10px 12px",
    borderBottom: "1px solid #1e3a5f",
    color: "#475569",
    fontSize: "11.5px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    background: "rgba(15,23,42,0.4)",
  },
  td: {
    padding: "11px 12px",
    borderBottom: "1px solid #243347",
    color: "#cbd5e1",
    fontSize: "13.5px",
    verticalAlign: "middle",
  },
  emptyTd: {
    padding: "32px 20px",
    textAlign: "center",
    color: "#475569",
    borderBottom: "1px solid #243347",
    fontSize: "14px",
  },
  actions: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  inactiveRow: {
    opacity: 0.55,
  },
  editingRow: {
    background: "rgba(234,88,12,0.06)",
  },
  activeBadge: {
    display: "inline-flex",
    padding: "3px 9px",
    borderRadius: "999px",
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.25)",
    color: "#86efac",
    fontWeight: 700,
    fontSize: "11.5px",
  },
  inactiveBadge: {
    display: "inline-flex",
    padding: "3px 9px",
    borderRadius: "999px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.22)",
    color: "#fca5a5",
    fontWeight: 700,
    fontSize: "11.5px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    marginTop: "18px",
    paddingTop: "14px",
    borderTop: "1px solid #243347",
  },
  pageButton: {
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "7px 16px",
    background: "transparent",
    color: "#94a3b8",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "13px",
  },
  pageInfo: {
    color: "#64748b",
    fontWeight: 600,
    fontSize: "13px",
  },
};


