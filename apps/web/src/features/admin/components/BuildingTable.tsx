import type { Dispatch, SetStateAction } from "react";
import type { Building } from "@ito-map/shared";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../types/routes";
import type { AdminBuildingStatusFilter } from "../hooks/useAdminBuildings";
import { safeText } from "../hooks/useBuildingForm";

type BuildingTableProps = {
  buildings: Building[];
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

const fieldCls =
  "min-h-11 w-full rounded-[10px] border border-[#334155] bg-[#0f172a] px-3.5 text-[13.5px] text-[#e2e8f0] outline-none transition-[border-color,box-shadow] duration-[180ms] focus:border-[#a8442e] focus:ring-2 focus:ring-[rgba(168,68,46,0.35)]";
const ghostBtn =
  "inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#334155] bg-transparent px-3.5 text-[13px] font-semibold text-[#94a3b8] transition-[background-color,color,transform] duration-[180ms] hover:-translate-y-px hover:bg-[#0f172a] hover:text-[#e2e8f0] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(168,68,46,0.35)]";
const rowBtn =
  "inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold transition-[background-color,transform] duration-[180ms] hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(168,68,46,0.35)]";

export function BuildingTable({
  buildings,
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
  const showActions = canEditBuildings || canEditPhotos;

  return (
    <section className="admin-table-card overflow-hidden rounded-[18px] border border-[#334155] bg-[#1e293b] p-[22px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] max-[640px]:rounded-[14px] max-[640px]:p-3.5">
      <div className="mb-4 flex items-start justify-between gap-4 max-[640px]:flex-col">
        <div>
          <h2 className="m-0 mb-1 text-[18px] font-bold text-[#f1f5f9]">
            Listado
          </h2>
          <p className="m-0 text-[13px] leading-relaxed text-[#64748b]">
            Mostrando {buildings.length} de {totalRecords} edificios.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 max-[640px]:w-full max-[640px]:justify-stretch">
          {canEditNavigation ? (
            <Link
              to={ROUTES.ADMIN_MAP}
              className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[10px] border border-[rgba(168,68,46,0.4)] bg-[rgba(168,68,46,0.15)] px-3.5 text-[13px] font-bold text-[#c56b52] no-underline transition-[background-color,transform] duration-[180ms] hover:-translate-y-px hover:bg-[rgba(168,68,46,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(168,68,46,0.45)] max-[640px]:flex-1"
            >
              Mapa de navegación
            </Link>
          ) : null}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loadingBuildings}
            className={`${ghostBtn} max-[640px]:flex-1`}
          >
            {loadingBuildings ? "Cargando…" : "Recargar"}
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-[1fr_180px] gap-3 max-[640px]:grid-cols-1">
        <input
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className={fieldCls}
          placeholder="Buscar por nombre, código o categoría"
        />
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as AdminBuildingStatusFilter)
          }
          className={`${fieldCls} font-semibold`}
        >
          <option value="all">Todos</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo inactivos</option>
        </select>
      </div>

      <div className="hidden gap-3 max-[640px]:grid">
        {buildings.map((building) => {
          const isActive = Boolean(building.is_active);
          const isBusy = actionLoadingId === building.id;
          const code = safeText(building.code) || "S/C";

          return (
            <article
              key={building.id}
              className={`rounded-[14px] border border-[#334155] bg-[#152033] p-3.5 shadow-[0_10px_26px_rgba(0,0,0,0.18)] ${
                !isActive ? "opacity-70" : ""
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="mb-1 inline-flex rounded-md border border-[rgba(168,68,46,0.28)] bg-[rgba(168,68,46,0.12)] px-2 py-1 text-[12px] font-black uppercase tracking-wide text-[#c56b52]">
                    {code}
                  </span>
                  <h3 className="m-0 text-[16px] font-bold leading-snug text-[#f1f5f9]">
                    {safeText(building.name) || "Sin nombre"}
                  </h3>
                </div>

                <span
                  className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11.5px] font-bold ${
                    isActive
                      ? "border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.12)] text-[#86efac]"
                      : "border-[rgba(239,68,68,0.22)] bg-[rgba(239,68,68,0.1)] text-[#fca5a5]"
                  }`}
                >
                  {isActive ? "Activo" : "Inactivo"}
                </span>
              </div>

              <dl className="mb-3 grid grid-cols-2 gap-2 text-[12.5px]">
                <div className="rounded-[10px] bg-[#0f172a] p-2.5">
                  <dt className="mb-1 font-bold uppercase tracking-wide text-[#64748b]">
                    Categoría
                  </dt>
                  <dd className="m-0 font-semibold text-[#cbd5e1]">
                    {safeText(building.category_name) || "Sin categoría"}
                  </dd>
                </div>
                <div className="rounded-[10px] bg-[#0f172a] p-2.5">
                  <dt className="mb-1 font-bold uppercase tracking-wide text-[#64748b]">
                    Modelo 3D
                  </dt>
                  <dd className="m-0 break-words font-semibold text-[#cbd5e1]">
                    {safeText(building.model_node_name) || "Sin nodo"}
                  </dd>
                </div>
              </dl>

              {showActions ? (
                <div className="grid grid-cols-2 gap-2">
                  {canEditBuildings ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onStartEdit(building)}
                        disabled={isBusy}
                        className="min-h-11 rounded-[10px] border border-[rgba(168,68,46,0.32)] bg-[rgba(168,68,46,0.14)] px-3 text-[13px] font-bold text-[#c56b52] disabled:opacity-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleStatus(building)}
                        disabled={isBusy}
                        className="min-h-11 rounded-[10px] border border-[#334155] bg-[#0f172a] px-3 text-[13px] font-bold text-[#cbd5e1] disabled:opacity-50"
                      >
                        {isActive ? "Desactivar" : "Activar"}
                      </button>
                    </>
                  ) : null}
                  {canEditPhotos ? (
                    <button
                      type="button"
                      onClick={() => onOpenImages(building)}
                      disabled={isBusy}
                      className="min-h-11 rounded-[10px] border border-[rgba(139,92,246,0.32)] bg-[rgba(139,92,246,0.12)] px-3 text-[13px] font-bold text-[#c4b5fd] disabled:opacity-50"
                    >
                      Fotos
                    </button>
                  ) : null}
                  {canEditBuildings ? (
                    <button
                      type="button"
                      onClick={() => onDelete(building)}
                      disabled={isBusy}
                      className="min-h-11 rounded-[10px] border border-[rgba(239,68,68,0.32)] bg-[rgba(239,68,68,0.1)] px-3 text-[13px] font-bold text-[#fca5a5] disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}

        {buildings.length === 0 ? (
          <div className="rounded-[14px] border border-[#334155] bg-[#152033] px-4 py-10 text-center text-[14px] text-[#94a3b8]">
            <p className="m-0 font-semibold text-[#cbd5e1]">
              No hay edificios para mostrar.
            </p>
            <p className="m-0 mt-1 text-[12.5px] text-[#64748b]">
              Ajusta la búsqueda o el filtro de estado.
            </p>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-[12px] max-[640px]:hidden">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              {["Código", "Nombre", "Categoría", "Modelo 3D", "Estado"].map(
                (h) => (
                  <th
                    key={h}
                    className="border-b border-[#1e3a5f] bg-[rgba(15,23,42,0.4)] px-3 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-wide text-[#64748b]"
                  >
                    {h}
                  </th>
                )
              )}
              {showActions ? (
                <th className="border-b border-[#1e3a5f] bg-[rgba(15,23,42,0.4)] px-3 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-wide text-[#64748b]">
                  Acciones
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {buildings.map((building, idx) => {
              const isActive = Boolean(building.is_active);
              const isCurrentEdit = editingBuilding?.id === building.id;
              const rowBg = isCurrentEdit
                ? "bg-[rgba(168,68,46,0.08)]"
                : idx % 2 === 1
                  ? "bg-[#1a2744]"
                  : "bg-transparent";

              return (
                <tr
                  key={building.id}
                  className={`${rowBg} transition-colors duration-[180ms] hover:bg-[rgba(168,68,46,0.06)] ${
                    !isActive ? "opacity-55" : ""
                  }`}
                >
                  <td className="border-b border-[#243347] px-3 py-3 align-middle text-[13.5px] font-semibold text-[#e2e8f0]">
                    {safeText(building.code)}
                  </td>
                  <td className="border-b border-[#243347] px-3 py-3 align-middle text-[13.5px] text-[#cbd5e1]">
                    {safeText(building.name)}
                  </td>
                  <td className="border-b border-[#243347] px-3 py-3 align-middle text-[13.5px] text-[#cbd5e1]">
                    {safeText(building.category_name) || "Sin categoría"}
                  </td>
                  <td className="border-b border-[#243347] px-3 py-3 align-middle text-[13.5px] text-[#94a3b8]">
                    {safeText(building.model_node_name) || "Sin nodo"}
                  </td>
                  <td className="border-b border-[#243347] px-3 py-3 align-middle">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-[3px] text-[11.5px] font-bold ${
                        isActive
                          ? "border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.12)] text-[#86efac]"
                          : "border-[rgba(239,68,68,0.22)] bg-[rgba(239,68,68,0.1)] text-[#fca5a5]"
                      }`}
                    >
                      {isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  {showActions ? (
                    <td className="border-b border-[#243347] px-3 py-3 align-middle">
                      <div className="flex flex-wrap gap-1.5">
                        {canEditBuildings ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onStartEdit(building)}
                              disabled={actionLoadingId === building.id}
                              className={`${rowBtn} border border-[rgba(168,68,46,0.3)] bg-[rgba(168,68,46,0.12)] text-[#c56b52]`}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleStatus(building)}
                              disabled={actionLoadingId === building.id}
                              className={`${rowBtn} border border-[#334155] bg-transparent text-[#94a3b8]`}
                            >
                              {isActive ? "Desactivar" : "Activar"}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(building)}
                              disabled={actionLoadingId === building.id}
                              className={`${rowBtn} border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] text-[#fca5a5]`}
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
                            className={`${rowBtn} border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.1)] text-[#c4b5fd]`}
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

            {buildings.length === 0 ? (
              <tr>
                <td
                  className="border-b border-[#243347] px-5 py-12 text-center text-[14px] text-[#475569]"
                  colSpan={showActions ? 6 : 5}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span className="font-semibold text-[#94a3b8]">
                      No hay edificios para mostrar.
                    </span>
                    <span className="text-[12.5px]">
                      Ajusta la búsqueda o el filtro de estado.
                    </span>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-[18px] flex items-center justify-center gap-3 border-t border-[#243347] pt-3.5 max-[640px]:grid max-[640px]:grid-cols-2 max-[640px]:gap-2">
        <button
          type="button"
          onClick={() =>
            onPageChange((currentPage) => Math.max(1, currentPage - 1))
          }
          disabled={page <= 1}
          className={ghostBtn}
        >
          Anterior
        </button>
        <span className="text-[13px] font-semibold text-[#64748b] max-[640px]:col-span-2 max-[640px]:row-start-1 max-[640px]:text-center">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() =>
            onPageChange((currentPage) => Math.min(totalPages, currentPage + 1))
          }
          disabled={page >= totalPages}
          className={ghostBtn}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
