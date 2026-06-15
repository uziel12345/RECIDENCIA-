-- ============================================================
-- Fix ruta Laboratorio de Quimica / LAB-QUI
-- ============================================================
-- Crea o reactiva el nodo de acceso, lo conecta al corredor de
-- Postgrado y enlaza el edificio LAB-QUI con esa entrada.

INSERT INTO navigation_nodes (
  id,
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
  metadata,
  created_at,
  updated_at
)
VALUES (
  UUID(),
  'n-acceso-lab-quimica',
  'Acceso Lab. Ingenieria Quimica',
  'entrance',
  -44,
  0,
  -82,
  NULL,
  NULL,
  0,
  1,
  1,
  JSON_OBJECT('source', 'migration-lab-quimica-route-20260612'),
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  node_type = VALUES(node_type),
  x = VALUES(x),
  y = VALUES(y),
  z = VALUES(z),
  is_walkable = 1,
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO navigation_edges (
  id,
  from_node_id,
  to_node_id,
  distance,
  is_bidirectional,
  is_accessible,
  path_type,
  is_active,
  metadata,
  created_at,
  updated_at
)
SELECT
  UUID(),
  n1.id,
  n2.id,
  35.44,
  1,
  1,
  'walkway',
  1,
  JSON_OBJECT('source', 'migration-lab-quimica-route-20260612'),
  NOW(),
  NOW()
FROM navigation_nodes n1
JOIN navigation_nodes n2 ON n2.code = 'n-acceso-lab-quimica'
WHERE n1.code = 'n-acceso-postgrado'
ON DUPLICATE KEY UPDATE
  distance = VALUES(distance),
  is_bidirectional = 1,
  is_accessible = 1,
  path_type = VALUES(path_type),
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO navigation_edges (
  id,
  from_node_id,
  to_node_id,
  distance,
  is_bidirectional,
  is_accessible,
  path_type,
  is_active,
  metadata,
  created_at,
  updated_at
)
SELECT
  UUID(),
  n1.id,
  n2.id,
  24.41,
  1,
  1,
  'walkway',
  1,
  JSON_OBJECT('source', 'migration-lab-quimica-route-20260612'),
  NOW(),
  NOW()
FROM navigation_nodes n1
JOIN navigation_nodes n2 ON n2.code = 'n-pasillo-postgrado-2'
WHERE n1.code = 'n-acceso-lab-quimica'
ON DUPLICATE KEY UPDATE
  distance = VALUES(distance),
  is_bidirectional = 1,
  is_accessible = 1,
  path_type = VALUES(path_type),
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP;

-- Conexion para la red de navegacion actual generada desde el editor.
-- Este nodo es el corredor caminable mas cercano al acceso de LAB-QUI.
INSERT INTO navigation_edges (
  id,
  from_node_id,
  to_node_id,
  distance,
  is_bidirectional,
  is_accessible,
  path_type,
  is_active,
  metadata,
  created_at,
  updated_at
)
SELECT
  UUID(),
  n1.id,
  n2.id,
  20.99,
  1,
  1,
  'walkway',
  1,
  JSON_OBJECT('source', 'migration-lab-quimica-route-20260612'),
  NOW(),
  NOW()
FROM navigation_nodes n1
JOIN navigation_nodes n2 ON n2.code = 'nav-p1-n3-mq6zeods'
WHERE n1.code = 'n-acceso-lab-quimica'
ON DUPLICATE KEY UPDATE
  distance = VALUES(distance),
  is_bidirectional = 1,
  is_accessible = 1,
  path_type = VALUES(path_type),
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP;

UPDATE navigation_edges e
JOIN navigation_nodes a ON a.id = e.from_node_id
JOIN navigation_nodes b ON b.id = e.to_node_id
SET
  e.is_bidirectional = 1,
  e.is_accessible = 1,
  e.is_active = 1,
  e.updated_at = CURRENT_TIMESTAMP
WHERE (
  a.code = 'n-acceso-postgrado'
  AND b.code = 'n-acceso-lab-quimica'
)
OR (
  a.code = 'n-acceso-lab-quimica'
  AND b.code = 'n-pasillo-postgrado-2'
)
OR (
  a.code = 'n-acceso-lab-quimica'
  AND b.code = 'nav-p1-n3-mq6zeods'
);

INSERT INTO building_entrances (
  id,
  building_id,
  node_id,
  entrance_name,
  entrance_type,
  is_primary,
  is_accessible,
  created_at,
  updated_at
)
SELECT
  UUID(),
  b.id,
  n.id,
  'Acceso principal - Lab. Ingenieria Quimica',
  'main',
  1,
  1,
  NOW(),
  NOW()
FROM buildings b
JOIN navigation_nodes n ON n.code = 'n-acceso-lab-quimica'
LEFT JOIN building_entrances be
  ON be.building_id = b.id
  AND be.node_id = n.id
WHERE b.code = 'LAB-QUI'
  AND be.id IS NULL;

UPDATE building_entrances be
JOIN buildings b ON b.id = be.building_id
JOIN navigation_nodes n ON n.id = be.node_id
SET
  be.entrance_name = 'Acceso principal - Lab. Ingenieria Quimica',
  be.entrance_type = 'main',
  be.is_primary = 1,
  be.is_accessible = 1,
  be.updated_at = CURRENT_TIMESTAMP
WHERE b.code = 'LAB-QUI'
  AND n.code = 'n-acceso-lab-quimica';
