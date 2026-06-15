import { useMemo } from "react";
import type { Building } from "../../features/buildings/types/building";
import { getCategoryAccent } from "../ui/categoryAccent";

export type CategoryLegendProps = {
  buildings: Building[];
};

export function CategoryLegend({ buildings }: CategoryLegendProps) {
  const items = useMemo(() => {
    const seen = new Map<
      string,
      { name: string; color: string; count: number }
    >();

    for (const building of buildings) {
      if (!building.is_active) continue;

      const accent = getCategoryAccent(building.category_name);
      const color = building.category_color || accent.fg;
      const key = building.category_name;
      const existing = seen.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        seen.set(key, {
          name: building.category_name,
          color,
          count: 1,
        });
      }
    }

    return Array.from(seen.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [buildings]);

  if (items.length === 0) return null;

  return (
    <div className="ito-legend anim-fade-in" aria-label="Leyenda de categorías">
      <div className="ito-legend__title">Categorías</div>

      <div className="ito-legend__items">
        {items.map((item) => (
          <div key={item.name} className="ito-legend__item">
            <span
              className="ito-legend__swatch"
              style={{ background: item.color }}
              aria-hidden="true"
            />
            <span style={{ flex: 1 }}>{item.name}</span>
            <span
              style={{
                color: "var(--color-text-muted)",
                fontWeight: 600,
              }}
            >
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
