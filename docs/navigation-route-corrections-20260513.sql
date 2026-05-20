-- Correcciones conservadoras de navegación ITO
-- Fecha: 2026-05-13
--
-- Fuente de revisión:
-- - Dump: C:\Users\Uziel Martinez\Documents\dumps\Dump20260513.sql
-- - Mapa oficial del Instituto Tecnológico de Oaxaca
-- - Capa debug del visor 3D
--
-- Objetivo:
-- Corregir primero el corredor H/I, que en la BD actual forma tramos
-- largos y visualmente confusos. No se eliminan todas las diagonales porque
-- el mapa oficial confirma que existen andadores diagonales reales.

START TRANSACTION;

-- 1. Reubicar el corredor H hacia el borde oeste del andador.
-- Estos cambios coinciden con los ajustes ya probados en el grafo local
-- `apps/web/src/features/buildings/navigation/data/campusNodes.ts`.
UPDATE navigation_nodes
SET
  x = -30.0000,
  z = -60.0000,
  updated_at = CURRENT_TIMESTAMP
WHERE code = 'n-pasillo-h-1';

UPDATE navigation_nodes
SET
  x = -32.0000,
  z = 10.0000,
  updated_at = CURRENT_TIMESTAMP
WHERE code = 'n-pasillo-h-2';

UPDATE navigation_nodes
SET
  x = -42.0000,
  z = 74.0000,
  updated_at = CURRENT_TIMESTAMP
WHERE code = 'n-pasillo-h-3';

-- 2. Agregar un nodo intermedio para romper el tramo largo H1 -> H2.
INSERT INTO navigation_nodes (
  code,
  name,
  node_type,
  x,
  y,
  z,
  latitude,
  longitude,
  floor_level,
  is_walkable,
  is_active,
  metadata
)
VALUES (
  'n-pasillo-h-1b',
  'Pasillo H 1B',
  'intersection',
  -30.0000,
  0.0000,
  -25.0000,
  NULL,
  NULL,
  0,
  1,
  1,
  JSON_OBJECT('source', 'navigation-route-corrections-20260513')
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  node_type = VALUES(node_type),
  x = VALUES(x),
  y = VALUES(y),
  z = VALUES(z),
  is_walkable = VALUES(is_walkable),
  is_active = VALUES(is_active),
  metadata = VALUES(metadata),
  updated_at = CURRENT_TIMESTAMP;

-- 3. Resolver IDs por código para que el script sea reutilizable entre dumps.
SET @h1 = (SELECT id FROM navigation_nodes WHERE code = 'n-pasillo-h-1' LIMIT 1);
SET @h1b = (SELECT id FROM navigation_nodes WHERE code = 'n-pasillo-h-1b' LIMIT 1);
SET @h2 = (SELECT id FROM navigation_nodes WHERE code = 'n-pasillo-h-2' LIMIT 1);
SET @h3 = (SELECT id FROM navigation_nodes WHERE code = 'n-pasillo-h-3' LIMIT 1);
SET @i1 = (SELECT id FROM navigation_nodes WHERE code = 'n-pasillo-i-1' LIMIT 1);

-- 4. Desactivar el tramo directo H1 -> H2. Lo reemplazamos por H1 -> H1B -> H2.
UPDATE navigation_edges
SET
  is_active = 0,
  metadata = JSON_OBJECT(
    'disabled_by',
    'navigation-route-corrections-20260513',
    'reason',
    'Replaced by intermediate H corridor node'
  ),
  updated_at = CURRENT_TIMESTAMP
WHERE from_node_id = @h1
  AND to_node_id = @h2;

-- 5. Crear/actualizar tramos nuevos con distancia calculada desde coordenadas.
INSERT INTO navigation_edges (
  from_node_id,
  to_node_id,
  distance,
  is_bidirectional,
  is_accessible,
  path_type,
  is_active,
  metadata
)
SELECT
  @h1,
  @h1b,
  ROUND(SQRT(POW(n1.x - n2.x, 2) + POW(n1.z - n2.z, 2)), 4),
  1,
  1,
  'walkway',
  1,
  JSON_OBJECT('source', 'navigation-route-corrections-20260513')
FROM navigation_nodes n1
JOIN navigation_nodes n2
WHERE n1.id = @h1
  AND n2.id = @h1b
ON DUPLICATE KEY UPDATE
  distance = VALUES(distance),
  is_bidirectional = VALUES(is_bidirectional),
  is_accessible = VALUES(is_accessible),
  path_type = VALUES(path_type),
  is_active = VALUES(is_active),
  metadata = VALUES(metadata),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO navigation_edges (
  from_node_id,
  to_node_id,
  distance,
  is_bidirectional,
  is_accessible,
  path_type,
  is_active,
  metadata
)
SELECT
  @h1b,
  @h2,
  ROUND(SQRT(POW(n1.x - n2.x, 2) + POW(n1.z - n2.z, 2)), 4),
  1,
  1,
  'walkway',
  1,
  JSON_OBJECT('source', 'navigation-route-corrections-20260513')
FROM navigation_nodes n1
JOIN navigation_nodes n2
WHERE n1.id = @h1b
  AND n2.id = @h2
ON DUPLICATE KEY UPDATE
  distance = VALUES(distance),
  is_bidirectional = VALUES(is_bidirectional),
  is_accessible = VALUES(is_accessible),
  path_type = VALUES(path_type),
  is_active = VALUES(is_active),
  metadata = VALUES(metadata),
  updated_at = CURRENT_TIMESTAMP;

-- 6. Actualizar distancias de tramos existentes afectados por las coordenadas.
UPDATE navigation_edges e
JOIN navigation_nodes n1 ON n1.id = e.from_node_id
JOIN navigation_nodes n2 ON n2.id = e.to_node_id
SET
  e.distance = ROUND(SQRT(POW(n1.x - n2.x, 2) + POW(n1.z - n2.z, 2)), 4),
  e.updated_at = CURRENT_TIMESTAMP
WHERE (e.from_node_id = @h2 AND e.to_node_id = @h3)
   OR (e.from_node_id = @h3 AND e.to_node_id = @i1);

-- 7. Invalidar cache desde la API después de aplicar:
-- POST /api/navigation/cache/invalidate

COMMIT;
