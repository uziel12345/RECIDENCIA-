import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createBuildingApi,
  getBuildingByIdApi,
  getCategoriesApi,
  updateBuildingApi,
  type Building,
  type BuildingCategory,
} from "@ito-map/shared";
import { AdminLayout } from "../components/AdminLayout";
import { BuildingForm } from "../components/BuildingForm";
import { BuildingImagesModal } from "../components/BuildingImagesModal";
import {
  buildCreateInput,
  buildUpdateInput,
  createSlug,
  initialFormState,
  mapBuildingToForm,
  safeText,
  type BuildingFormState,
} from "../hooks/useBuildingForm";
import { resolveBuildingImageUrl } from "../../../utils/resolve-api-asset-url";
import { useAdminAuthStore } from "../../../store/admin-auth-store";

export function AdminBuildingEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAdminAuthStore();
  const isSuperAdmin = user?.role === "superadmin";
  const canEdit = user?.role === "admin" || isSuperAdmin;
  const isEditing = Boolean(id);

  const [building, setBuilding] = useState<Building | null>(null);
  const [categories, setCategories] = useState<BuildingCategory[]>([]);
  const [form, setForm] = useState<BuildingFormState>(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showImages, setShowImages] = useState(false);

  const loadEditor = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const categoriesRequest = getCategoriesApi();

      if (id) {
        const [nextCategories, nextBuilding] = await Promise.all([
          categoriesRequest,
          getBuildingByIdApi(id),
        ]);
        setCategories(Array.isArray(nextCategories) ? nextCategories : []);
        setBuilding(nextBuilding);
        setForm(mapBuildingToForm(nextBuilding));
      } else {
        const nextCategories = await categoriesRequest;
        setCategories(Array.isArray(nextCategories) ? nextCategories : []);
        setBuilding(null);
        setForm(initialFormState);
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudo cargar el editor de edificio";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadEditor();
  }, [loadEditor]);

  function updateFormField<K extends keyof BuildingFormState>(
    key: K,
    value: BuildingFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: current.slug ? current.slug : createSlug(value),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (building) {
        const updated = await updateBuildingApi(
          building.id,
          buildUpdateInput(form, building)
        );
        setBuilding(updated);
        setForm(mapBuildingToForm(updated));
        setMessage("Edificio actualizado correctamente.");
      } else {
        const created = await createBuildingApi(buildCreateInput(form));
        setMessage("Edificio creado correctamente.");
        navigate(`/admin/buildings/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : building
            ? "No se pudo actualizar el edificio"
            : "No se pudo crear el edificio";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const coverUrl = resolveBuildingImageUrl(building?.cover_image_url ?? null);

  return (
    <AdminLayout>
      <div className="min-h-full px-8 py-7">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="m-0 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#f97316]">
              Gestion de campus
            </p>
            <h1 className="m-0 mb-1.5 text-[28px] font-bold leading-tight text-[#f1f5f9]">
              {isEditing ? "Editar edificio" : "Agregar edificio"}
            </h1>
            <p className="m-0 text-[14px] text-[#64748b]">
              {building
                ? safeText(building.name)
                : "Registra la informacion principal del edificio."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/buildings")}
            className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#334155] bg-transparent px-4 text-[13px] font-semibold text-[#94a3b8] transition-colors duration-[180ms] hover:bg-[#1e293b] hover:text-[#e2e8f0]"
          >
            Volver al listado
          </button>
        </header>

        {error ? (
          <div
            role="alert"
            className="mb-[18px] rounded-[10px] border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.1)] px-3.5 py-3 text-[13.5px] font-medium text-[#fca5a5]"
          >
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-[18px] rounded-[10px] border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.1)] px-3.5 py-3 text-[13.5px] font-medium text-[#86efac]">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[18px] border border-[#334155] bg-[#1e293b] p-8 text-[14px] text-[#94a3b8]">
            Cargando editor...
          </div>
        ) : (
          <section className="grid grid-cols-1 items-start gap-[22px] xl:grid-cols-[300px_1fr]">
            <aside className="rounded-[18px] border border-[#334155] bg-[#1e293b] p-[22px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] xl:sticky xl:top-6">
              <p className="m-0 mb-3 text-[11px] font-bold uppercase tracking-wider text-[#f97316]">
                Vista del edificio
              </p>
              <div className="overflow-hidden rounded-[14px] border border-[#334155] bg-[#0f172a]">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={`Foto de ${safeText(building?.name) || "edificio"}`}
                    className="block aspect-[16/10] w-full object-cover"
                  />
                ) : (
                  <div className="grid aspect-[16/10] place-items-center bg-[#0f172a] px-6 text-center text-[13px] font-medium text-[#64748b]">
                    Sin foto de portada registrada
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h2 className="m-0 mb-1 text-[18px] font-bold text-[#f1f5f9]">
                  {safeText(building?.name) || "Nuevo edificio"}
                </h2>
                <p className="m-0 text-[13px] leading-relaxed text-[#94a3b8]">
                  {safeText(building?.description) ||
                    "La foto de portada se mostrara aqui al registrar imagenes."}
                </p>
              </div>

              {building ? (
                <button
                  type="button"
                  onClick={() => setShowImages(true)}
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-[10px] border border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.12)] px-4 text-[13px] font-bold text-[#c4b5fd] transition-colors duration-[180ms] hover:bg-[rgba(139,92,246,0.2)]"
                >
                  Administrar fotos
                </button>
              ) : null}
            </aside>

            <BuildingForm
              form={form}
              categories={categories}
              isEditing={Boolean(building)}
              editingBuildingName={safeText(building?.name)}
              saving={saving}
              buildingId={building?.id}
              onSubmit={handleSubmit}
              onCancelEdit={() => navigate("/admin/buildings")}
              onNameChange={handleNameChange}
              onUpdateFormField={updateFormField}
            />
          </section>
        )}
      </div>

      {building && showImages ? (
        <BuildingImagesModal
          building={building}
          onClose={() => {
            setShowImages(false);
            void loadEditor();
          }}
        />
      ) : null}
    </AdminLayout>
  );
}
