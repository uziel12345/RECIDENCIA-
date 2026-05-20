# Diagnóstico de navegación - 2026-05-13

Fuente revisada: `C:\Users\Uziel Martinez\Documents\dumps\Dump20260513.sql`

## Resumen

- `navigation_nodes`: 66 registros
- `navigation_edges`: 85 registros
- Aristas activas y accesibles: 71
- `building_entrances`: 17 registros
- Aristas marcadas como problemáticas por la capa debug: 6

La app usa `navigation_nodes`, `navigation_edges` y `building_entrances` desde la base de datos. Por eso los cambios visuales en `campusNodes.ts` solo ayudan como fallback local; las rutas reales se corrigen actualizando la BD.

## Referencia oficial

El mapa oficial del Instituto Tecnológico de Oaxaca muestra varios andadores diagonales reales. Por eso una diagonal no debe considerarse error por sí sola.

Criterio actualizado:

- Si la diagonal coincide con un andador del plano oficial, se conserva.
- Si la diagonal atraviesa un edificio, bloque o zona sin andador, se reemplaza por nodos intermedios.
- Si el tramo es extremadamente largo, se revisa como prioridad alta aunque sea recto.
- La capa debug marca diagonales como "Revisar con plano" y reserva rojo para tramos muy largos.

## Aristas problemáticas activas

| Tipo | Distancia | dx | dz | Desde | Hacia | Edge ID |
| --- | ---: | ---: | ---: | --- | --- | --- |
| Revisar con plano | 71.0 | 12.0 | 70.0 | `n-pasillo-h-1` | `n-pasillo-h-2` | `a3761bdd-3f3a-11f1-b497-d843ae05cb18` |
| Revisar con plano | 67.5 | 14.0 | 66.0 | `n-pasillo-h-3` | `n-pasillo-i-1` | `a3761d56-3f3a-11f1-b497-d843ae05cb18` |
| Revisar con plano | 63.2 | 12.0 | 62.0 | `n-pasillo-h-2` | `n-pasillo-h-3` | `a3761c55-3f3a-11f1-b497-d843ae05cb18` |
| Revisar con plano | 43.9 | 22.0 | 38.0 | `n-pasillo-industrial-1` | `n-pasillo-k-1` | `a37627e6-3f3a-11f1-b497-d843ae05cb18` |
| Revisar con plano | 42.4 | 30.0 | 30.0 | `camino_centro_1` | `dir_camino_5` | `89b20853-42c0-11f1-ab6d-d843ae05cb18` |
| Revisar con plano | 36.9 | 28.0 | 24.0 | `n-pasillo-cafeteria-1` | `n-pasillo-q-1` | `a37625ca-3f3a-11f1-b497-d843ae05cb18` |

## Corrección recomendada por etapas

1. Corregir primero el corredor H/I:
   - `n-pasillo-h-1 -> n-pasillo-h-2`
   - `n-pasillo-h-2 -> n-pasillo-h-3`
   - `n-pasillo-h-3 -> n-pasillo-i-1`

   Script preparado: `docs/navigation-route-corrections-20260513.sql`.

   Este script:

   - Reubica `n-pasillo-h-1`, `n-pasillo-h-2` y `n-pasillo-h-3`.
   - Agrega `n-pasillo-h-1b`.
   - Desactiva el tramo directo `n-pasillo-h-1 -> n-pasillo-h-2`.
   - Agrega `n-pasillo-h-1 -> n-pasillo-h-1b -> n-pasillo-h-2`.
   - Recalcula distancias de los tramos H afectados.

2. Después corregir conexiones laterales:
   - `n-pasillo-industrial-1 -> n-pasillo-k-1`
   - `n-pasillo-cafeteria-1 -> n-pasillo-q-1`

3. Revisar si `camino_centro_1 -> dir_camino_5` representa un camino real. Si no, se debe desactivar o reemplazar por nodos intermedios.

## Qué falta para una corrección exacta

Para hacer una migración SQL precisa, hay que comparar cada tramo marcado con el mapa oficial y el modelo 3D. El mapa oficial confirma que existen diagonales reales, así que no deben eliminarse en bloque.
