import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MapLayerControls } from "./MapLayerControls";

describe("MapLayerControls", () => {
  it("exposes independent building and street label visibility", () => {
    const markup = renderToStaticMarkup(
      createElement(MapLayerControls, {
        showBuildingLabels: false,
        showStreetLabels: true,
        onToggleBuildingLabels: vi.fn(),
        onToggleStreetLabels: vi.fn(),
      })
    );

    expect(markup).toContain("aria-label=\"Capas de etiquetas del mapa\"");
    expect(markup).toContain("aria-pressed=\"false\">Edificios");
    expect(markup).toContain("aria-pressed=\"true\">Calles");
  });
});
