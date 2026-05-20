-- Seguimiento de corrección H/I
-- Fecha: 2026-05-13
--
-- Motivo:
-- En la BD activa el nodo intermedio existe como `PASILLO_H_1B`
-- por collation case-insensitive, pero el código esperado en el repo es
-- `n-pasillo-h-1b`. Además, el tramo directo H1 -> H2 quedó activo.

START TRANSACTION;

-- 1. Normalizar código del nodo intermedio.
UPDATE navigation_nodes
SET
  code = 'n-pasillo-h-1b',
  name = 'Pasillo H 1B',
  node_type = 'intersection',
  x = -30.0000,
  y = 0.0000,
  z = -25.0000,
  is_walkable = 1,
  is_active = 1,
  metadata = JSON_OBJECT('source', 'navigation-route-corrections-followup-20260513'),
  updated_at = CURRENT_TIMESTAMP
WHERE code = 'PASILLO_H_1B';

SET @h1 = (SELECT id FROM navigation_nodes WHERE code = 'n-pasillo-h-1' LIMIT 1);
SET @h1b = (SELECT id FROM navigation_nodes WHERE code = 'n-pasillo-h-1b' LIMIT 1);
SET @h2 = (SELECT id FROM navigation_nodes WHERE code = 'n-pasillo-h-2' LIMIT 1);
SET @h3 = (SELECT id FROM navigation_nodes WHERE code = 'n-pasillo-h-3' LIMIT 1);
SET @i1 = (SELECT id FROM navigation_nodes WHERE code = 'n-pasillo-i-1' LIMIT 1);

-- 2. Desactivar tramo directo reemplazado.
UPDATE navigation_edges
SET
  is_active = 0,
  metadata = JSON_OBJECT(
    'disabled_by',
    'navigation-route-corrections-followup-20260513',
    'reason',
    'Direct H1-H2 edge replaced by H1-H1B-H2'
  ),
  updated_at = CURRENT_TIMESTAMP
WHERE from_node_id = @h1
  AND to_node_id = @h2;

-- 3. Recalcular distancias de los tramos H activos.
UPDATE navigation_edges e
JOIN navigation_nodes n1 ON n1.id = e.from_node_id
JOIN navigation_nodes n2 ON n2.id = e.to_node_id
SET
  e.distance = ROUND(SQRT(POW(n1.x - n2.x, 2) + POW(n1.z - n2.z, 2)), 4),
  e.is_accessible = 1,
  e.is_active = 1,
  e.path_type = 'walkway',
  e.updated_at = CURRENT_TIMESTAMP
WHERE (e.from_node_id = @h1 AND e.to_node_id = @h1b)
   OR (e.from_node_id = @h1b AND e.to_node_id = @h2)
   OR (e.from_node_id = @h2 AND e.to_node_id = @h3)
   OR (e.from_node_id = @h3 AND e.to_node_id = @i1);

COMMIT;
