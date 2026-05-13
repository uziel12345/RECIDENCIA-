import { useCallback, useEffect, useMemo, useState } from "react";
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

export type AdminBuildingStatusFilter = "all" | "active" | "inactive";

const ADMIN_BUILDINGS_LIMIT = 10;

export function useAdminBuildings() {
  const [buildings, setBuildings] = useState<Building[]>([]);
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
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [imageModalBuilding, setImageModalBuilding] =
    useState<Building | null>(null);

  const isEditing = editingBuilding !== null;
  const limit = ADMIN_BUILDINGS_LIMIT;

  const filteredBuildings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return buildings.filter((building) => {
      const name = safeText(building.name).toLowerCase();
      const code = safeText(building.code).toLowerCase();
      const categoryName = safeText(building.category_name).toLowerCase();
      const categoryCode = safeText(building.category_code).toLowerCase();

      const matchesSearch =
        !term ||
        name.includes(term) ||
        code.includes(term) ||
        categoryName.includes(term) ||
        categoryCode.includes(term);

      const isActive = Boolean(building.is_active);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [buildings, searchTerm, statusFilter]);

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
      const response = await getAdminBuildingsPaginatedApi(page, limit);

      setBuildings(Array.isArray(response.data) ? response.data : []);
      setTotalPages(response.pagination?.totalPages ?? 1);
      setTotalRecords(response.pagination?.total ?? response.data?.length ?? 0);
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
  }, [limit, page]);

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

  return {
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
    limit,
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
  };
}