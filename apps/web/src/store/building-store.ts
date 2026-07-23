import { create } from "zustand";
import type { Building, Gate, SearchResult, SearchResultKind } from "@ito-map/shared";

export type SectionKind = "aulas" | "tramites" | "departamentos" | "cubiculos" | "jefaturas";

export type HighlightedSection = {
  section: SectionKind;
  targetId: string;
};

const SECTION_BY_KIND: Partial<Record<SearchResultKind, SectionKind>> = {
  classroom: "aulas",
  procedure: "tramites",
  service: "tramites",
  department: "departamentos",
  cubicle: "cubiculos",
  headquarters: "jefaturas",
};

type BuildingStore = {
  selectedBuilding: Building | null;
  selectedGate: Gate | null;
  searchTerm: string;
  activeCategory: string | null;
  selectedSearchResult: SearchResult | null;
  highlightedSection: HighlightedSection | null;

  setSelectedBuilding: (building: Building | null) => void;
  setSelectedGate: (gate: Gate | null) => void;
  setSearchTerm: (value: string) => void;
  setActiveCategory: (category: string | null) => void;
  setSelectedSearchResult: (result: SearchResult | null) => void;
  selectSearchResult: (result: SearchResult, buildings: Building[], gates: Gate[]) => void;
  clearSelection: () => void;
  resetBuildingState: () => void;
};

export const useBuildingStore = create<BuildingStore>((set) => ({
  selectedBuilding: null,
  selectedGate: null,
  searchTerm: "",
  activeCategory: null,
  selectedSearchResult: null,
  highlightedSection: null,

  setSelectedBuilding: (building) =>
    set((state) =>
      state.selectedBuilding?.id === building?.id && !state.selectedGate && !state.highlightedSection
        ? state
        : {
            selectedBuilding: building,
            selectedGate: null,
            highlightedSection: null,
          }
    ),

  setSelectedGate: (gate) =>
    set((state) =>
      state.selectedGate?.id === gate?.id && !state.selectedBuilding
        ? state
        : {
            selectedGate: gate,
            selectedBuilding: null,
            highlightedSection: null,
          }
    ),

  setSearchTerm: (value) =>
    set((state) =>
      state.searchTerm === value
        ? state
        : {
            searchTerm: value,
          }
    ),

  setActiveCategory: (category) =>
    set({
      activeCategory: category,
    }),

  setSelectedSearchResult: (result) =>
    set({
      selectedSearchResult: result,
    }),

  // Punto único de entrada para "el usuario eligió un resultado de búsqueda".
  // Decide qué seleccionar (edificio o puerta) y qué sección de la barra
  // lateral resaltar — para no repetir esta lógica en
  // BuildingSearch/BuildingSidebar/MapSearchOverlay.
  selectSearchResult: (result, buildings, gates) =>
    set((state) => {
      if (result.kind === "gate") {
        const gate =
          gates.find((g) => g.id === result.id) ??
          (result.coordinates
            ? {
                id: result.id,
                name: result.title,
                description: null,
                access_type: "peatonal" as const,
                status: "abierta" as const,
                x: result.coordinates.x,
                y: 0,
                z: result.coordinates.z,
                is_active: true,
              }
            : null);

        if (!gate) return state;

        return {
          selectedGate: gate,
          selectedBuilding: null,
          highlightedSection: null,
          selectedSearchResult: null,
        };
      }

      if (result.kind === "building") {
        const building = buildings.find((b) => b.id === result.id);
        if (!building) return state;

        return {
          selectedBuilding: building,
          selectedGate: null,
          highlightedSection: null,
          selectedSearchResult: null,
        };
      }

      const building = result.buildingId
        ? buildings.find((b) => b.id === result.buildingId)
        : undefined;
      if (!building) return state;

      const section = SECTION_BY_KIND[result.kind];

      return {
        selectedBuilding: building,
        selectedGate: null,
        selectedSearchResult: result,
        highlightedSection: section ? { section, targetId: result.id } : null,
      };
    }),

  clearSelection: () =>
    set({
      selectedBuilding: null,
      selectedGate: null,
      highlightedSection: null,
    }),

  resetBuildingState: () =>
    set({
      selectedBuilding: null,
      selectedGate: null,
      searchTerm: "",
      activeCategory: null,
      selectedSearchResult: null,
      highlightedSection: null,
    }),
}));
