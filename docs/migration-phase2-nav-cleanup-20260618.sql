-- ============================================================
-- FASE 2: Limpieza de datos de navegación
-- Fecha: 2026-06-18
--
-- Ejecutar en orden. Incluye verificaciones antes y después.
-- ============================================================

-- ── VERIFICACIÓN INICIAL ──────────────────────────────────────
SELECT '=== ESTADO INICIAL ===' AS info;
SELECT 'navigation_nodes'   AS tabla, COUNT(*) AS total FROM navigation_nodes
UNION ALL
SELECT 'navigation_edges',   COUNT(*) FROM navigation_edges
UNION ALL
SELECT 'building_entrances', COUNT(*) FROM building_entrances;

-- Si navigation_nodes = 0 o 1, ejecutar primero:
--   SOURCE docs/migration-navigation-unified-20260526.sql;
-- Luego volver a ejecutar este archivo.

-- ── PASO 1: Corregir path_type ────────────────────────────────
-- Todos los edges tienen 'sidewalk' pero el tipo TS espera 'walkway'.
UPDATE navigation_edges
SET path_type = 'walkway'
WHERE path_type = 'sidewalk';

SELECT CONCAT('Edges corregidos: ', ROW_COUNT()) AS resultado;

-- ── PASO 1.5: Cambiar columnas a ENUM ────────────────────────
-- Debe ir DESPUÉS del UPDATE de path_type para que MySQL acepte
-- la conversión (no habría valores inválidos en la columna).
ALTER TABLE navigation_edges
  MODIFY COLUMN path_type
    ENUM('walkway','ramp','stairs','hallway','outdoor')
    NOT NULL DEFAULT 'walkway';

ALTER TABLE building_entrances
  MODIFY COLUMN entrance_type
    ENUM('main','secondary','service','emergency')
    NOT NULL DEFAULT 'main';

-- ── PASO 2: Borrar entradas automáticas ──────────────────────
-- Las entradas fueron asignadas automáticamente por distancia geométrica
-- desde el pivot del GLB (no desde la puerta real). Se borran para que
-- el administrador las cree manualmente desde el panel de navegación.
DELETE FROM building_entrances;

SELECT CONCAT('Entradas eliminadas: ', ROW_COUNT()) AS resultado;

-- ── VERIFICACIÓN FINAL ────────────────────────────────────────
SELECT '=== ESTADO FINAL ===' AS info;
SELECT 'navigation_nodes'   AS tabla, COUNT(*) AS total FROM navigation_nodes
UNION ALL
SELECT 'navigation_edges',   COUNT(*) FROM navigation_edges
UNION ALL
SELECT 'building_entrances', COUNT(*) FROM building_entrances;

-- Resultado esperado:
--   navigation_nodes   → 86
--   navigation_edges   → 97
--   building_entrances →  0  (las crearás manualmente)

-- ── DIAGNÓSTICO: path_type únicos ───────────────────────────
SELECT '=== path_type únicos en edges ===' AS info;
SELECT path_type, COUNT(*) AS cantidad
FROM navigation_edges
GROUP BY path_type;
-- Debe mostrar solo: walkway | 97
