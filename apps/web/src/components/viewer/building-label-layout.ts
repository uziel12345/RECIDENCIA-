export type LabelRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type LabelOffset = { x: number; y: number };

export type LabelLayoutItem = {
  id: string;
  rect: LabelRect;
  priority: number;
  distance: number;
  previousOffset?: LabelOffset;
};

export type LabelLayoutOptions = {
  collisionMargin?: number;
  viewportMargin?: number;
  gridStep?: number;
};

export function shiftLabelRect(
  rect: LabelRect,
  offset: LabelOffset,
): LabelRect {
  return {
    left: rect.left + offset.x,
    right: rect.right + offset.x,
    top: rect.top + offset.y,
    bottom: rect.bottom + offset.y,
  };
}

export function labelRectsOverlap(
  a: LabelRect,
  b: LabelRect,
  margin = 0,
): boolean {
  return !(
    a.right + margin <= b.left ||
    a.left >= b.right + margin ||
    a.bottom + margin <= b.top ||
    a.top >= b.bottom + margin
  );
}

function rectIntersects(a: LabelRect, b: LabelRect): boolean {
  return !(
    a.right <= b.left ||
    a.left >= b.right ||
    a.bottom <= b.top ||
    a.top >= b.bottom
  );
}

function rectFitsViewport(
  rect: LabelRect,
  viewport: LabelRect,
  margin: number,
): boolean {
  return (
    rect.left >= viewport.left + margin &&
    rect.right <= viewport.right - margin &&
    rect.top >= viewport.top + margin &&
    rect.bottom <= viewport.bottom - margin
  );
}

function offsetKey(offset: LabelOffset): string {
  return `${offset.x}:${offset.y}`;
}

function buildCandidateOffsets(
  viewport: LabelRect,
  step: number,
): LabelOffset[] {
  const width = viewport.right - viewport.left;
  const height = viewport.bottom - viewport.top;
  // 32 anillos cubren 576 px en escritorio y 448 px en móvil. Es suficiente
  // para salir de sidebars/controles sin generar decenas de miles de objetos
  // en cada revisión durante una rotación.
  const maxRing = Math.min(
    32,
    Math.ceil(Math.max(width, height) / step),
  );
  const offsets: LabelOffset[] = [{ x: 0, y: 0 }];

  // Espiral cuadrada: busca primero alrededor del ancla y solo se aleja lo
  // necesario. La fila superior va antes que la inferior para mantener los
  // rótulos encima de los edificios siempre que haya espacio.
  for (let ring = 1; ring <= maxRing; ring += 1) {
    for (let column = -ring; column <= ring; column += 1) {
      offsets.push({ x: column * step, y: -ring * step });
      offsets.push({ x: column * step, y: ring * step });
    }
    for (let row = -ring + 1; row < ring; row += 1) {
      offsets.push({ x: -ring * step, y: row * step });
      offsets.push({ x: ring * step, y: row * step });
    }
  }

  return offsets;
}

export function resolveNonOverlappingLabelOffsets(
  items: readonly LabelLayoutItem[],
  obstacles: readonly LabelRect[],
  viewport: LabelRect,
  options: LabelLayoutOptions = {},
): Map<string, LabelOffset> {
  const collisionMargin = options.collisionMargin ?? 6;
  const viewportMargin = options.viewportMargin ?? 8;
  const gridStep = options.gridStep ?? 18;
  const candidates = buildCandidateOffsets(viewport, gridStep);
  const accepted: LabelRect[] = [];
  const result = new Map<string, LabelOffset>();

  const ordered = [...items].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.distance - b.distance;
  });

  for (const item of ordered) {
    const width = item.rect.right - item.rect.left;
    const height = item.rect.bottom - item.rect.top;
    if (
      width <= 1 ||
      height <= 1 ||
      !rectIntersects(item.rect, viewport)
    ) {
      result.set(item.id, { x: 0, y: 0 });
      continue;
    }

    const itemCandidates: LabelOffset[] = [];
    const seen = new Set<string>();
    if (item.previousOffset) itemCandidates.push(item.previousOffset);
    itemCandidates.push(...candidates);

    let chosen: LabelOffset | null = null;
    for (const offset of itemCandidates) {
      const key = offsetKey(offset);
      if (seen.has(key)) continue;
      seen.add(key);
      const candidateRect = shiftLabelRect(item.rect, offset);
      if (!rectFitsViewport(candidateRect, viewport, viewportMargin)) continue;
      if (
        obstacles.some((obstacle) =>
          labelRectsOverlap(candidateRect, obstacle, collisionMargin),
        )
      ) {
        continue;
      }
      if (
        accepted.some((other) =>
          labelRectsOverlap(candidateRect, other, collisionMargin),
        )
      ) {
        continue;
      }
      chosen = offset;
      accepted.push(candidateRect);
      break;
    }

    // El viewport normal tiene capacidad de sobra para las etiquetas visibles.
    // Este fallback conserva la etiqueta en su ancla ante un caso extremo; no
    // se oculta nunca y la siguiente revisión vuelve a intentar distribuirla.
    const finalOffset = chosen ?? { x: 0, y: 0 };
    result.set(item.id, finalOffset);
    if (!chosen) accepted.push(shiftLabelRect(item.rect, finalOffset));
  }

  return result;
}
