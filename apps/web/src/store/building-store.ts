import { create } from "zustand";
import type { Building, SearchResult } from "@ito-map/shared";

export type RouteStats = {
  totalDistance: number;   // metros
  estimatedSeconds: number;
};

type BuildingStore = {
  selectedBuilding: Building | null;
  routeDestination: Building | null;
  currentRouteNodeIds: string[];
  routeStats: RouteStats | null;
  routeError: string | null;
  searchTerm: string;
  activeCategory: string | null;
  selectedSearchResult: SearchResult | null;

  setSelectedBuilding: (building: Building | null) => void;
  setRouteDestination: (building: Building | null) => void;
  setCurrentRouteNodeIds: (nodeIds: string[]) => void;
  setRouteStats: (stats: RouteStats | null) => void;
  setRouteError: (error: string | null) => void;
  setSearchTerm: (value: string) => void;
  setActiveCategory: (category: string | null) => void;
  setSelectedSearchResult: (result: SearchResult | null) => void;
  clearRoute: () => void;
  clearSelection: () => void;
  resetBuildingState: () => void;
};

export const useBuildingStore = create<BuildingStore>((set) => ({
  selectedBuilding: null,
  routeDestination: null,
  currentRouteNodeIds: [],
  routeStats: null,
  routeError: null,
  searchTerm: "",
  activeCategory: null,
  selectedSearchResult: null,

  setSelectedBuilding: (building) =>
    set((state) =>
      state.selectedBuilding?.id === building?.id
        ? state
        : {
            selectedBuilding: building,
          }
    ),

  setRouteDestination: (building) =>
    set({
      routeDestination: building,
      routeError: null,
    }),

  setCurrentRouteNodeIds: (nodeIds) =>
    set({
      currentRouteNodeIds: nodeIds,
    }),

  setRouteStats: (stats) =>
    set({
      routeStats: stats,
    }),

  setRouteError: (error) =>
    set({
      routeError: error,
    }),

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

  clearRoute: () =>
    set({
      routeDestination: null,
      currentRouteNodeIds: [],
      routeStats: null,
      routeError: null,
    }),

  clearSelection: () =>
    set({
      selectedBuilding: null,
    
    }),

  resetBuildingState: () =>
    set({
      selectedBuilding: null,
      routeDestination: null,
      currentRouteNodeIds: [],
      routeStats: null,
      routeError: null,
      searchTerm: "",
      activeCategory: null,
      selectedSearchResult: null,
    }),
}));
