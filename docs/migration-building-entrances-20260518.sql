-- Sincronización de building_entrances
-- Fecha: 2026-05-18
-- Fuente: apps/web/src/features/buildings/navigation/data/buildingEntrances.ts
-- Entradas: 38 (une buildings.slug con navigation_nodes.code)
--
-- PREREQUISITO: Ejecutar en este orden:
--   1. migration-navigation-reset-20260518.sql
--   2. migration-buildings-missing-20260518.sql
--   3. Este archivo

TRUNCATE TABLE building_entrances;

INSERT INTO building_entrances (id, building_id, node_id, entrance_name, entrance_type, is_primary, is_accessible)
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-direccion'
WHERE b.slug = 'direccion'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-biblioteca'
WHERE b.slug = 'biblioteca'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-centro-computo'
WHERE b.slug = 'centro-computo'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-h'
WHERE b.slug = 'edificio-h'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-i'
WHERE b.slug = 'edificio-i'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-j'
WHERE b.slug = 'edificio-j'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-e'
WHERE b.slug = 'edificio-e'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-f'
WHERE b.slug = 'edificio-f'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-g'
WHERE b.slug = 'edificio-g'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-audiovisual'
WHERE b.slug = 'audiovisual-licenciatura'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-edificio-nuevo'
WHERE b.slug = 'edificio-nuevo'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-cafeteria'
WHERE b.slug = 'cafeteria'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-gimnasio'
WHERE b.slug = 'gimnasio'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-q'
WHERE b.slug = 'edificio-q'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-lab-industrial'
WHERE b.slug = 'laboratorio-ingenieria-industrial'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-aulas-s'
WHERE b.slug = 'aulas-s'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-k'
WHERE b.slug = 'edificio-k'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-l'
WHERE b.slug = 'edificio-l'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-x'
WHERE b.slug = 'edificiox'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-x001'
WHERE b.slug = 'edificiox001'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-c'
WHERE b.slug = 'edificio-c'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-b'
WHERE b.slug = 'edificio-b'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-fisico-quimica'
WHERE b.slug = 'fisico-quimica'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-sala-titulacion'
WHERE b.slug = 'sala-titulacion'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-1007'
WHERE b.slug = '1007'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-1008'
WHERE b.slug = '1008'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-geolocalizacion'
WHERE b.slug = 'geolocalizacion'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-1009'
WHERE b.slug = '1009'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-postgrado'
WHERE b.slug = 'postgrado'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-lab-quimica'
WHERE b.slug = 'lab-quimica'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-lab-electrica'
WHERE b.slug = 'lab-electrica'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-quimica-bioquimica'
WHERE b.slug = 'depto-quimica-bioquimica'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-asesorias'
WHERE b.slug = 'asesorias'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-cubiculos-doctorado'
WHERE b.slug = 'cubiculos-doctorado'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-electronica'
WHERE b.slug = 'depto-electronica'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-audiovisual-postgrado'
WHERE b.slug = 'audiovisual-postgrado'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-aulas-enie'
WHERE b.slug = 'aulas-enie'
UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1
FROM buildings b JOIN navigation_nodes n ON n.code = 'n-acceso-lab-civil'
WHERE b.slug = 'lab-civil';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- SELECT COUNT(*) AS total FROM building_entrances;  -- esperado: 38
