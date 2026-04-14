import { create } from "zustand";
import type { Building } from "../features/buildings/types/building";

type BuildingStore = {
  selectedBuilding: Building | null;
  searchTerm: string;
  routeOrigin: Building | null;
  routeDestination: Building | null;
  setSelectedBuilding: (building: Building | null) => void;
  setSearchTerm: (value: string) => void;
  setRouteOrigin: (building: Building | null) => void;
  setRouteDestination: (building: Building | null) => void;
  clearRoute: () => void;
};

export const useBuildingStore = create<BuildingStore>((set) => ({
  selectedBuilding: null,
  searchTerm: "",
  routeOrigin: null,
  routeDestination: null,
  setSelectedBuilding: (building) => set({ selectedBuilding: building }),
  setSearchTerm: (value) => set({ searchTerm: value }),
  setRouteOrigin: (building) => set({ routeOrigin: building }),
  setRouteDestination: (building) => set({ routeDestination: building }),
  clearRoute: () => set({ routeOrigin: null, routeDestination: null }),
}));