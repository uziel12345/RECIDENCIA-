import { describe, expect, it } from "vitest";
import {
  labelRectsOverlap,
  resolveNonOverlappingLabelOffsets,
  shiftLabelRect,
  type LabelLayoutItem,
  type LabelRect,
} from "./building-label-layout";

const viewport: LabelRect = { left: 0, top: 0, right: 420, bottom: 280 };

describe("building label layout", () => {
  it("separa etiquetas que nacen sobre la misma ancla sin ocultarlas", () => {
    const items: LabelLayoutItem[] = [
      { id: "a", rect: { left: 160, top: 100, right: 240, bottom: 128 }, priority: 0, distance: 1 },
      { id: "b", rect: { left: 160, top: 100, right: 240, bottom: 128 }, priority: 1, distance: 2 },
      { id: "c", rect: { left: 160, top: 100, right: 240, bottom: 128 }, priority: 1, distance: 3 },
    ];

    const offsets = resolveNonOverlappingLabelOffsets(items, [], viewport);
    const placed = items.map((item) =>
      shiftLabelRect(item.rect, offsets.get(item.id) ?? { x: 0, y: 0 }),
    );

    expect(offsets.size).toBe(3);
    expect(labelRectsOverlap(placed[0], placed[1], 6)).toBe(false);
    expect(labelRectsOverlap(placed[0], placed[2], 6)).toBe(false);
    expect(labelRectsOverlap(placed[1], placed[2], 6)).toBe(false);
  });

  it("mueve las etiquetas fuera de paneles reservados", () => {
    const item: LabelLayoutItem = {
      id: "dir",
      rect: { left: 20, top: 100, right: 90, bottom: 128 },
      priority: 0,
      distance: 1,
    };
    const sidebar = { left: 0, top: 0, right: 120, bottom: 280 };
    const offsets = resolveNonOverlappingLabelOffsets(
      [item],
      [sidebar],
      viewport,
    );
    const placed = shiftLabelRect(item.rect, offsets.get(item.id)!);

    expect(labelRectsOverlap(placed, sidebar, 6)).toBe(false);
    expect(placed.left).toBeGreaterThanOrEqual(126);
  });

  it("conserva un desplazamiento previo si continúa siendo válido", () => {
    const previousOffset = { x: 54, y: -36 };
    const item: LabelLayoutItem = {
      id: "caf",
      rect: { left: 150, top: 120, right: 210, bottom: 148 },
      priority: 0,
      distance: 1,
      previousOffset,
    };

    const offsets = resolveNonOverlappingLabelOffsets([item], [], viewport);

    expect(offsets.get("caf")).toEqual(previousOffset);
  });
});
