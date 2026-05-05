import { useState } from "react";
import type { Building } from "../../buildings/types/building";
import { SearchIcon, EditIcon, PlusIcon, TrashIcon } from "../../shared/Icons";

interface BuildingManagerProps {
  buildings: Building[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function BuildingManager({ buildings, isLoading }: BuildingManagerProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredBuildings = buildings.filter((building) => {
    const searchValue = search.trim().toLowerCase();

    const matchesSearch =
      !searchValue ||
      building.name.toLowerCase().includes(searchValue) ||
      building.code.toLowerCase().includes(searchValue) ||
      building.category_name.toLowerCase().includes(searchValue);

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && building.is_active) ||
      (filter === "inactive" && !building.is_active);

    return matchesSearch && matchesFilter;
  });

  const categoryColors: Record<string, string> = {
    administrativo: "#2563eb",
    aulas: "#059669",
    laboratorio: "#7c3aed",
    laboratorios: "#7c3aed",
    servicio: "#d97706",
    servicios: "#d97706",
    biblioteca: "#dc2626",
    otro: "#64748b",
  };

  function getCategoryColor(categoryCode: string) {
    return categoryColors[categoryCode] || categoryColors.otro;
  }

  function handleEdit(building: Building) {
    console.log("Editar edificio pendiente:", building);
  }

  function handleDelete(building: Building) {
    console.log("Eliminar edificio pendiente:", building);
  }

  return (
    <div className="building-manager">
      <header className="building-manager__header">
        <div className="building-manager__title">
          <h1>Gestion de Edificios</h1>
          <p>Administra los edificios y puntos del campus</p>
        </div>

        <button className="building-manager__add-btn" type="button">
          <PlusIcon size={18} />
          <span>Agregar Edificio</span>
        </button>
      </header>

      <div className="building-manager__toolbar">
        <div className="building-manager__search">
          <SearchIcon size={18} />
          <input
            type="text"
            placeholder="Buscar edificios..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="building-manager__filters">
          <button
            type="button"
            className={`building-manager__filter ${
              filter === "all" ? "is-active" : ""
            }`}
            onClick={() => setFilter("all")}
          >
            Todos ({buildings.length})
          </button>

          <button
            type="button"
            className={`building-manager__filter ${
              filter === "active" ? "is-active" : ""
            }`}
            onClick={() => setFilter("active")}
          >
            Activos ({buildings.filter((building) => building.is_active).length})
          </button>

          <button
            type="button"
            className={`building-manager__filter ${
              filter === "inactive" ? "is-active" : ""
            }`}
            onClick={() => setFilter("inactive")}
          >
            Inactivos (
            {buildings.filter((building) => !building.is_active).length})
          </button>
        </div>
      </div>

      <div className="building-manager__content">
        {isLoading ? (
          <div className="building-manager__loading">
            <div className="building-manager__spinner" />
            <p>Cargando edificios...</p>
          </div>
        ) : filteredBuildings.length === 0 ? (
          <div className="building-manager__empty">
            <p>No se encontraron edificios</p>
          </div>
        ) : (
          <div className="building-manager__table-wrapper">
            <table className="building-manager__table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Nombre</th>
                  <th>Categoria</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredBuildings.map((building) => {
                  const categoryColor = getCategoryColor(building.category_code);

                  return (
                    <tr key={building.id}>
                      <td>
                        <span className="building-manager__code">
                          {building.code}
                        </span>
                      </td>

                      <td>
                        <span className="building-manager__name">
                          {building.name}
                        </span>
                      </td>

                      <td>
                        <span
                          className="building-manager__category"
                          style={{
                            background: `${categoryColor}15`,
                            color: categoryColor,
                            borderColor: `${categoryColor}30`,
                          }}
                        >
                          {building.category_name}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`building-manager__status ${
                            building.is_active ? "is-active" : "is-inactive"
                          }`}
                        >
                          {building.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td>
                        <div className="building-manager__actions">
                          <button
                            type="button"
                            className="building-manager__action-btn"
                            title="Editar"
                            onClick={() => handleEdit(building)}
                          >
                            <EditIcon size={16} />
                          </button>

                          <button
                            type="button"
                            className="building-manager__action-btn building-manager__action-btn--danger"
                            title="Eliminar"
                            onClick={() => handleDelete(building)}
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}