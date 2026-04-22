import { create } from "zustand";
import type { Building } from "../features/buildings/types/building";

type BuildingStore = {
  selectedBuilding: Building | null;
  routeDestination: Building | null;
  currentRouteNodeIds: string[];
  searchTerm: string;

  setSelectedBuilding: (building: Building | null) => void;
  setRouteDestination: (building: Building | null) => void;
  setCurrentRouteNodeIds: (nodeIds: string[]) => void;
  setSearchTerm: (value: string) => void;
  clearRoute: () => void;
};

export const useBuildingStore = create<BuildingStore>((set) => ({
  selectedBuilding: null,
  routeDestination: null,
  currentRouteNodeIds: [],
  searchTerm: "",

  setSelectedBuilding: (building) =>
    set({
      selectedBuilding: building,
    }),

  setRouteDestination: (building) =>
    set({
      routeDestination: building,
    }),

  setCurrentRouteNodeIds: (nodeIds) =>
    set({
      currentRouteNodeIds: nodeIds,
    }),

  setSearchTerm: (value) =>
    set({
      searchTerm: value,
    }),

  clearRoute: () =>
    set({
      routeDestination: null,
      currentRouteNodeIds: [],
    }),
}));