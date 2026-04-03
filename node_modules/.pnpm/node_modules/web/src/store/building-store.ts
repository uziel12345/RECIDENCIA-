import { create } from "zustand";
import type { Building } from "../features/buildings/types/building";

type BuildingStore = {
  selectedBuilding: Building | null;
  searchTerm: string;
  setSelectedBuilding: (building: Building | null) => void;
  setSearchTerm: (value: string) => void;
};

export const useBuildingStore = create<BuildingStore>((set) => ({
  selectedBuilding: null,
  searchTerm: "",
  setSelectedBuilding: (building) => set({ selectedBuilding: building }),
  setSearchTerm: (value) => set({ searchTerm: value }),
}));