# Coordenadas de edificios del modelo actual

Auditoría y corrección realizada el 4 de agosto de 2026 contra
`apps/web/public/models/campus.glb`.

## Resultado

- Registros en producción: 78.
- Edificios activos: 57.
- Correspondencias inequívocas edificio→nodo GLB: 64.
- Registros sin nodo en el modelo actual: 14, todos inactivos.
- Coordenadas heredadas con diferencia mayor a 25 unidades: 60 antes de la
  migración y 0 después de aplicarla.
- Perfil affine activo del modelo anterior: desactivado.

La lista completa, incluyendo coordenadas anteriores, coordenadas actuales y
distancia de corrección, está en
`building-model-coordinates-current-20260804.csv`. El reporte estructurado con
los límites de cada nodo está en
`building-model-coordinates-audit-20260804.json`.

## Método

Para cada registro se resuelve `model_node_name` con el mismo mapa de alias que
usa `CampusViewer`. Después se obtiene la caja envolvente mundial del nodo y se
calcula su centro:

```text
x = (minX + maxX) / 2
z = (minZ + maxZ) / 2
```

Es el mismo criterio X/Z usado en tiempo de ejecución para etiquetas, enfoque
de cámara y marcadores. La coordenada Y de la base se conserva porque el
marcador debe permanecer al nivel del suelo.

## Registros sin nodo actual

No se modificaron: `1007`, `1008`, `1009`, `D`, `GEO`, `J`, `MC`, `O`, `POS`,
`PTR`, `TEMP-DEL`, `TMP-20260430124616`, `X` y `X001`. Todos estaban inactivos
y sus nombres de modelo no existen en el GLB actual.

## Aplicación en producción

Antes de la migración se creó el respaldo:

```text
/var/backups/mapa-ito/mapa-ito-20260804T214531Z.tar.gz
```

La migración `migration-building-model-coordinates-20260804.sql`:

1. respalda las filas afectadas en tablas separadas;
2. actualiza 64 edificios con guardas por `id` y `model_node_name`;
3. sincroniza los X/Z duplicados en 14 puntos de calibración;
4. desactiva perfiles affine calculados contra el modelo anterior;
5. verifica todas las coordenadas antes de confirmar la transacción.

Tablas de respaldo creadas:

- `buildings_backup_20260804_glb_actual`: 64 filas.
- `calibration_points_backup_20260804_glb_actual`: 14 filas.
- `calibration_profiles_backup_20260804_glb_actual`: 5 filas.

## Volver a generar la auditoría

El comando reutilizable es:

```bash
pnpm --filter web audit:model-coordinates \
  --api-url https://recorridovirtual-ito.tailc9c1c3.ts.net/api/buildings
```

La API pública contiene los edificios activos. Para auditar también los
inactivos, el script acepta un archivo JSON mediante `--input` o un JSON en
base64 mediante `--input-env`.
