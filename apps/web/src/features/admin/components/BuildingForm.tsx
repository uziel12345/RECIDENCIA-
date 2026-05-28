import type { CSSProperties, FormEvent } from "react";
import type { BuildingCategory } from "@ito-map/shared";
import type { BuildingFormState } from "../hooks/useBuildingForm";

type BuildingFormProps = {
  form: BuildingFormState;
  categories: BuildingCategory[];
  isEditing: boolean;
  editingBuildingName: string;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onCancelEdit: () => void;
  onNameChange: (value: string) => void;
  onUpdateFormField: <K extends keyof BuildingFormState>(
    key: K,
    value: BuildingFormState[K]
  ) => void;
};

export function BuildingForm({
  form,
  categories,
  isEditing,
  editingBuildingName,
  saving,
  onSubmit,
  onCancelEdit,
  onNameChange,
  onUpdateFormField,
}: BuildingFormProps) {
  return (
    <form onSubmit={onSubmit} style={styles.formCard}>
      <div style={styles.formHeader}>
        <div>
          <h2 style={styles.sectionTitle}>
            {isEditing ? "Editar edificio" : "Crear edificio"}
          </h2>

          {isEditing ? (
            <p style={styles.text}>
              Editando: <strong>{editingBuildingName}</strong>
            </p>
          ) : (
            <p style={styles.text}>
              Registra un nuevo edificio para el mapa interactivo.
            </p>
          )}
        </div>

        {isEditing ? (
          <button type="button" onClick={onCancelEdit} style={styles.cancelButton}>
            Cancelar
          </button>
        ) : null}
      </div>

      <div style={styles.grid}>
        <label style={styles.label}>
          Código
          <input
            value={form.code}
            onChange={(event) => onUpdateFormField("code", event.target.value)}
            required
            style={styles.input}
            placeholder="EDIF-A"
          />
        </label>

        <label style={styles.label}>
          Nombre
          <input
            value={form.name}
            onChange={(event) => onNameChange(event.target.value)}
            required
            style={styles.input}
            placeholder="Edificio A"
          />
        </label>

        <label style={styles.label}>
          Slug
          <input
            value={form.slug}
            onChange={(event) => onUpdateFormField("slug", event.target.value)}
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
              onUpdateFormField("category_code", event.target.value)
            }
            required
            style={styles.input}
          >
            <option value="">Seleccionar...</option>
            {categories
              .filter((category) => Boolean(category.is_active))
              .map((category) => (
                <option key={category.id} value={category.code}>
                  {category.name} ({category.code})
                </option>
              ))}
          </select>
        </label>

        <label style={styles.label}>
          Nodo del modelo 3D
          <input
            value={form.model_node_name}
            onChange={(event) =>
              onUpdateFormField("model_node_name", event.target.value)
            }
            required
            style={styles.input}
            placeholder="Building_A"
          />
        </label>
      </div>

      <label style={styles.label}>
        Descripción
        <textarea
          value={form.description}
          onChange={(event) =>
            onUpdateFormField("description", event.target.value)
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
            onUpdateFormField("is_priority", event.target.checked)
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
  );
}

const styles: Record<string, CSSProperties> = {
  formCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "14px",
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
};
