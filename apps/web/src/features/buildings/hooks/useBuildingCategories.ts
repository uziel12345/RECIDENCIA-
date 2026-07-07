import { useMemo } from "react";
import type { Building } from "@ito-map/shared";

export function useBuildingCategories(buildings: Building[]) {
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const building of buildings) {
      if (!building.is_active) continue;
      map.set(
        building.category_name,
        (map.get(building.category_name) ?? 0) + 1
      );
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [buildings]);

  const totalActive = useMemo(
    () => buildings.filter((building) => building.is_active).length,
    [buildings]
  );

  return { categories, totalActive };
}
