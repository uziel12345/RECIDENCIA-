// La posición de cada etiqueta se calcula automáticamente (centro superior
// real del nodo GLB, vía THREE.Box3) — ver BuildingLabels en CampusViewer.tsx.
// Este archivo es la única vía para corregir manualmente un caso puntual
// donde ese cálculo automático no dé un buen resultado (ej. un edificio con
// geometría muy irregular, o cuyo nodo abarca más de lo que se ve en pantalla).
//
// Cómo usarlo:
// 1. Encuentra el `building.id` (UUID) del edificio a ajustar — la forma más
//    rápida es seleccionarlo en el mapa y mirar `selectedBuilding.id` en
//    React DevTools, o consultarlo en la tabla `buildings`.
// 2. Agrega una entrada aquí. `offsetY` desplaza la etiqueta hacia arriba (+)
//    o abajo (-) en unidades del mundo 3D, encima de la posición calculada
//    — úsalo para el 90% de los casos (edificio bien centrado en X/Z, solo
//    la altura queda incómoda).
// 3. Si además el punto X/Z automático está mal (nodo GLB con geometría
//    fuera de lugar), usa `position` para reemplazar las 3 coordenadas por
//    completo, en el mismo espacio local que usa el resto del visor
//    (coordenadas `campus_x`/`y`/`campus_z` de la BD, no las del mundo GLB).
//
// No es necesario (ni se debe) reexportar campus.glb para corregir esto.
export type BuildingLabelPositionOverride = {
  offsetY?: number;
  position?: readonly [number, number, number];
};

export const BUILDING_LABEL_POSITION_OVERRIDES: Readonly<
  Record<string, BuildingLabelPositionOverride>
> = {
  // "82000000-0000-4000-8000-000000000001": { offsetY: 6 },
};
