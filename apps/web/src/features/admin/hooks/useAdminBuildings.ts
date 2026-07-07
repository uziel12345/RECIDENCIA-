import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  createBuildingApi,
  deleteBuildingApi,
  getAdminBuildingsApi,
  getCategoriesApi,
  updateBuildingApi,
  updateBuildingStatusApi,
  type Building,
  type BuildingCategory,
} from "@ito-map/shared";
import {
  buildCreateInput,
  buildUpdateInput,
  createSlug,
  initialFormState,
  mapBuildingToForm,
  safeText,
  type BuildingFormState,
} from "./useBuildingForm";
import { matchesSearchWords } from "../../../utils/search-match";

export type AdminBuildingStatusFilter = "all" | "active" | "inactive";

const ADMIN_BUILDINGS_PAGE_SIZE = 10;

export function useAdminBuildings() {
  // Todos los edificios (el dataset es pequeño, ~60 registros) — la búsqueda y
  // la paginación se hacen en el cliente sobre este arreglo completo, para que
  // buscar encuentre coincidencias en cualquier página, no solo la visible.
  const [allBuildings, setAllBuildings] = useState<Building[]>([]);
  const [categories, setCategories] = useState<BuildingCategory[]>([]);
  const [form, setForm] = useState<BuildingFormState>(initialFormState);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<AdminBuildingStatusFilter>("all");
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [imageModalBuilding, setImageModalBuilding] =
    useState<Building | null>(null);

  const isEditing = editingBuilding !== null;
  const limit = ADMIN_BUILDINGS_PAGE_SIZE;

  const filteredBuildings = useMemo(() => {
    return allBuildings.filter((building) => {
      const searchableText = [
        safeText(building.name),
        safeText(building.code),
        safeText(building.category_name),
        safeText(building.category_code),
      ].join(" ");

      const matchesSearch = matchesSearchWords(searchableText, searchTerm);

      const isActive = Boolean(building.is_active);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [allBuildings, searchTerm, statusFilter]);

  const totalRecords = filteredBuildings.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

  // La búsqueda/filtro puede reducir los resultados por debajo de la página
  // actual (ej. estabas en la página 4 y ahora solo hay 1 página de resultados).
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  // Reinicia a la página 1 cuando cambia el término de búsqueda o el filtro,
  // para no quedar "atascado" en una página que ya no tiene sentido.
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const pagedBuildings = useMemo(
    () => filteredBuildings.slice((page - 1) * limit, page * limit),
    [filteredBuildings, page, limit]
  );

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategoriesApi();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadBuildings = useCallback(async () => {
    setLoadingBuildings(true);
    setError(null);

    try {
      const data = await getAdminBuildingsApi();
      setAllBuildings(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los edificios";

      setError(msg);
      setAllBuildings([]);
    } finally {
      setLoadingBuildings(false);
    }
  }, []);

  useEffect(() => {
    void loadBuildings();
    void loadCategories();
  }, [loadBuildings, loadCategories]);

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

    const nextStatus = !building.is_active;

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

  return {
    buildings: pagedBuildings,
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
    limit,
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
  };
}
