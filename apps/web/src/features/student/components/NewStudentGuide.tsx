import { useCallback } from "react";
import { useBuildingStore } from "../../../store/building-store";
import { useBuildings } from "../../../hooks/useBuildings";

type GuideItem = {
  title: string;
  description: string;
  searchTerm: string;
  emoji: string;
};

const GUIDE_ITEMS: GuideItem[] = [
  {
    title: "Control escolar",
    description: "Inscripciones, constancias y trámites académicos",
    searchTerm: "servicios escolares",
    emoji: "🎓",
  },
  {
    title: "Dirección",
    description: "Dirección general del plantel",
    searchTerm: "dirección",
    emoji: "🏛️",
  },
  {
    title: "Biblioteca",
    description: "Préstamo de libros y sala de lectura",
    searchTerm: "biblioteca",
    emoji: "📚",
  },
  {
    title: "Cafetería",
    description: "Servicio de alimentos dentro del campus",
    searchTerm: "cafetería",
    emoji: "🍽️",
  },
  {
    title: "Aulas",
    description: "Localiza tu salón de clases",
    searchTerm: "aula",
    emoji: "🚪",
  },
  {
    title: "Laboratorios",
    description: "Prácticas y talleres de tu carrera",
    searchTerm: "laboratorio",
    emoji: "🔬",
  },
];

type Props = {
  onSearchActivated?: () => void;
};

export function NewStudentGuide({ onSearchActivated }: Props) {
  const setSearchTerm = useBuildingStore((s) => s.setSearchTerm);
  const { buildings } = useBuildings({});

  const handleTileClick = useCallback(
    (searchTerm: string) => {
      setSearchTerm(searchTerm);
      onSearchActivated?.();
    },
    [setSearchTerm, onSearchActivated],
  );

  const activeCount = buildings.filter((b) => b.is_active).length;

  return (
    <div className="ito-new-student-guide">
      <div className="ito-new-student-guide__header">
        <h2 className="ito-new-student-guide__title">Guía de nuevo ingreso</h2>
        <p className="ito-new-student-guide__subtitle">
          {activeCount > 0
            ? `${activeCount} edificios en el campus`
            : "Selecciona un lugar para buscarlo en el mapa"}
        </p>
      </div>

      <div className="ito-new-student-guide__grid">
        {GUIDE_ITEMS.map((item) => (
          <button
            key={item.title}
            type="button"
            className="ito-new-student-guide__tile"
            onClick={() => handleTileClick(item.searchTerm)}
            title={item.description}
          >
            <span className="ito-new-student-guide__tile-emoji" aria-hidden="true">
              {item.emoji}
            </span>
            <span className="ito-new-student-guide__tile-title">{item.title}</span>
            <span className="ito-new-student-guide__tile-desc">{item.description}</span>
          </button>
        ))}
      </div>

      <p className="ito-new-student-guide__hint">
        Toca cualquier lugar para buscarlo en el mapa y obtener una ruta.
      </p>
    </div>
  );
}
