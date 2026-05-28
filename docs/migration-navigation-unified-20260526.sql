-- ============================================================
-- MIGRACIÓN UNIFICADA — Navegación campus ITO
-- Fecha: 2026-05-26
-- 86 nodos (80 base + 6 esquinas) | 98 aristas | 38 entradas
--
-- PREREQUISITO:  ya ejecutado
-- ESTE ARCHIVO REEMPLAZA:
--   migration-navigation-reset-20260518.sql
--   migration-navigation-corner-nodes-20260525.sql
--   migration-building-entrances-20260518.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE building_entrances;
TRUNCATE TABLE navigation_edges;
TRUNCATE TABLE navigation_nodes;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- NODOS: 80 base + 6 esquinas = 86
-- ============================================================
INSERT INTO navigation_nodes (id, code, name, node_type, x, y, z, latitude, longitude, floor_level, is_walkable, is_active, metadata, created_at, updated_at) VALUES
-- ── Base (80) ────────────────────────────────────────────────
(UUID(), 'n-acceso-direccion',              'Acceso Dirección',                  'entrance',      -78, 0,   50, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-direccion-biblioteca',  'Pasillo Dirección - Biblioteca',    'waypoint',      -48, 0,   28, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-biblioteca',             'Acceso Biblioteca',                 'entrance',        8, 0,    0, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-cruce-biblioteca-centro',       'Cruce Biblioteca - Centro',         'intersection',   -6, 0,   -8, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-centro-1',              'Pasillo Centro 1',                  'waypoint',       -2, 0,  -48, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-centro-2',              'Pasillo Centro 2',                  'intersection',   -1, 0,  -88, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-central-oeste',         'Pasillo Central Oeste',             'waypoint',      -45, 0,  -90, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-centro-computo',         'Acceso Centro de Cómputo',          'entrance',        2, 0, -112, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-esquina-cc-h',                  'Esquina CC - H',                    'intersection',  -30, 0, -112, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-h-1',                   'Pasillo H-1',                       'waypoint',      -30, 0,  -60, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-h-1b',                  'Pasillo H-1B',                      'waypoint',      -30, 0,  -25, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-h-2',                   'Pasillo H-2',                       'waypoint',      -32, 0,   10, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-h-3',                   'Pasillo H-3',                       'intersection',  -42, 0,   74, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-cruce-h-f',                     'Cruce H - F',                       'intersection',   -4, 0,   74, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-h',                      'Acceso Edificio H',                 'entrance',      -38, 0,  108, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-i-1',                   'Pasillo I-1',                       'intersection',  -48, 0,  138, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-i-2',                   'Pasillo I-2',                       'intersection',  -56, 0,  158, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-i',                      'Acceso Edificio I',                 'entrance',      -54, 0,  162, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-j',                     'Pasillo J',                         'waypoint',      -42, 0,  170, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-j',                      'Acceso Edificio J',                 'entrance',      -35, 0,  162, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-e-1',                   'Pasillo E-1',                       'intersection',    0, 0,   42, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-e',                      'Acceso Edificio E',                 'entrance',       10, 0,   86, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-f-1',                   'Pasillo F-1',                       'intersection',    4, 0,  108, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-f',                      'Acceso Edificio F',                 'entrance',        8, 0,  118, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-g-1',                   'Pasillo G-1',                       'intersection',    2, 0,  136, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-g',                      'Acceso Edificio G',                 'entrance',        8, 0,  148, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-zona-gik',              'Pasillo Zona G-I-K',                'intersection',  -18, 0,  144, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-audiovisual',            'Acceso Audiovisual Licenciatura',   'entrance',      -40, 0,    5, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-audiovisual-lic',       'Pasillo Audiovisual Licenciatura',  'waypoint',      -22, 0,    5, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-edificio-nuevo',         'Acceso Edificio Nuevo',             'entrance',      -58, 0,  150, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-cafeteria-1',           'Pasillo Cafetería-1',               'intersection',   12, 0,   28, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-cafeteria',              'Acceso Cafetería',                  'entrance',       22, 0,   58, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-q-1',                   'Pasillo Q-1',                       'intersection',   40, 0,   52, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-q',                      'Acceso Edificio Q',                 'entrance',       58, 0,   74, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-industrial-1',          'Pasillo Industrial-1',              'intersection',   70, 0,   98, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-lab-industrial',         'Acceso Lab. Industrial',            'entrance',       72, 0,  112, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-k-1',                   'Pasillo K-1',                       'intersection',   48, 0,  136, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-k',                      'Acceso Edificio K',                 'entrance',       46, 0,  148, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-aulas-s-1',             'Pasillo Aulas S-1',                 'waypoint',       58, 0,  152, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-aulas-s',                'Acceso Aulas S',                    'entrance',       62, 0,  160, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-gimnasio-1',            'Pasillo Gimnasio-1',                'waypoint',       50, 0,   28, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-gimnasio',               'Acceso Gimnasio',                   'entrance',       56, 0,   18, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-fisico-1',              'Pasillo Físico-Química',            'intersection',  -18, 0,  -16, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-fisico-quimica',         'Acceso Físico-Química',             'entrance',      -22, 0,  -18, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-l-1',                   'Pasillo L-1',                       'intersection',    6, 0,  -16, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-l',                      'Acceso Edificio L',                 'entrance',       22, 0,  -18, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-x-1',                   'Pasillo X-1',                       'intersection',   34, 0,  -16, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-x',                      'Acceso Edificio X',                 'entrance',       46, 0,  -14, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-x001-1',                'Pasillo X001-1',                    'intersection',   12, 0,  -46, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-x001',                   'Acceso Edificio X001',              'entrance',        8, 0,  -54, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-c-1',                   'Pasillo C-1',                       'intersection',  -46, 0,  -14, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-c',                      'Acceso Edificio C',                 'entrance',      -58, 0,  -14, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-b-1',                   'Pasillo B-1',                       'intersection',  -42, 0,  -42, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-b',                      'Acceso Edificio B',                 'entrance',      -52, 0,  -48, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-sala-1',                'Pasillo Sala Titulación',           'intersection',  -78, 0,  -44, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-sala-titulacion',        'Acceso Sala Titulación',            'entrance',      -94, 0,  -44, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-1007-1',                'Pasillo 1007-1',                    'waypoint',     -116, 0,  -18, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-1007',                   'Acceso Aula 1007',                  'entrance',     -128, 0,   -8, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-1008-1',                'Pasillo 1008-1',                    'intersection', -142, 0,  -48, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-1008',                   'Acceso Aula 1008',                  'entrance',     -158, 0,  -44, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-geolocalizacion',        'Acceso Geolocalización',            'entrance',     -148, 0,  -62, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-1009-1',                'Pasillo 1009-1',                    'intersection', -118, 0,  -82, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-1009',                   'Acceso Aula 1009',                  'entrance',     -114, 0,  -90, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-postgrado-1',           'Pasillo Posgrado-1',                'intersection',  -90, 0,  -92, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-postgrado',              'Acceso Posgrado',                   'entrance',      -78, 0,  -92, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-lab-quimica',            'Acceso Lab. Química',               'entrance',      -44, 0,  -82, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-postgrado-2',           'Pasillo Posgrado-2',                'waypoint',      -24, 0,  -96, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-lab-electrica',          'Acceso Lab. Eléctrica',             'entrance',      -72, 0, -116, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-cruce-sur-cc',                  'Cruce Sur CC',                      'intersection',    2, 0,  -96, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-doctorado-1',           'Pasillo Doctorado-1',               'intersection',   20, 0, -122, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-cubiculos-doctorado',    'Acceso Cubículos Doctorado',        'entrance',       32, 0, -124, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-electronica-1',         'Pasillo Electrónica-1',             'intersection',   48, 0,  -98, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-electronica',            'Acceso Electrónica',                'entrance',       54, 0,  -50, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-audiovisual-post-1',    'Pasillo Audiovisual Posgrado-1',    'intersection',   64, 0, -118, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-audiovisual-postgrado',  'Acceso Audiovisual Posgrado',       'entrance',       70, 0, -116, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-aulas-enie',             'Acceso Aulas ENIE',                 'entrance',       54, 0, -107, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-quimica-bio-1',         'Pasillo Química-Bio-1',             'intersection',   28, 0, -156, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-quimica-bioquimica',     'Acceso Química y Bioquímica',       'entrance',       26, 0, -127, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-asesorias',              'Acceso Asesorías',                  'entrance',       12, 0,   -4, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-lab-civil',              'Acceso Lab. Civil',                 'entrance',       20, 0,  -95, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
-- ── Esquinas originales (4) ──────────────────────────────────
-- Rompen 4 diagonales confirmadas (identificadas con NavigationDebugLayer)
(UUID(), 'n-esquina-dir-centro',            'Esquina Dirección - Centro',        'waypoint',       -6, 0,   28, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-esquina-sala-1007',             'Esquina Sala - 1007',               'waypoint',     -116, 0,  -44, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-esquina-postgrado-electrica',   'Esquina Posgrado - Lab Eléctrica',  'waypoint',      -72, 0,  -96, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-esquina-enie-quimica',          'Esquina ENIE - Química-Bio',        'waypoint',       28, 0, -107, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
-- ── Esquinas nuevas (2) ──────────────────────────────────────
-- Rompen 4 diagonales adicionales detectadas por coordenadas
(UUID(), 'n-esquina-doctorado-electronica', 'Esquina Doctorado - Electrónica',   'waypoint',       48, 0, -122, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-esquina-industrial-k',          'Esquina Industrial - K',            'waypoint',       48, 0,   98, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW());

-- ============================================================
-- ARISTAS: 83 base (91 - 8 diagonales) + 14 nuevas = 97
-- ============================================================
INSERT INTO navigation_edges (id, from_node_id, to_node_id, distance, is_bidirectional, is_accessible, path_type, is_active, created_at, updated_at)

-- ── Zona norte / Dirección - Biblioteca ───────────────────────
SELECT UUID(), n1.id, n2.id,  37.20, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-direccion-biblioteca'  WHERE n1.code='n-acceso-direccion' UNION ALL
-- (diagonal dir-bib → cruce eliminada; sustituida por las 2 aristas en L más abajo)
SELECT UUID(), n1.id, n2.id,  16.12, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-cruce-biblioteca-centro'        WHERE n1.code='n-acceso-biblioteca' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.28, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-cafeteria-1'            WHERE n1.code='n-acceso-biblioteca' UNION ALL
SELECT UUID(), n1.id, n2.id,  40.20, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-centro-1'               WHERE n1.code='n-cruce-biblioteca-centro' UNION ALL
SELECT UUID(), n1.id, n2.id,  50.36, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-e-1'                   WHERE n1.code='n-cruce-biblioteca-centro' UNION ALL
SELECT UUID(), n1.id, n2.id,  14.42, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-fisico-1'               WHERE n1.code='n-cruce-biblioteca-centro' UNION ALL
SELECT UUID(), n1.id, n2.id,  20.62, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-audiovisual-lic'        WHERE n1.code='n-cruce-biblioteca-centro' UNION ALL
SELECT UUID(), n1.id, n2.id,   5.66, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-asesorias'               WHERE n1.code='n-acceso-biblioteca' UNION ALL

-- ── Pasillo central ───────────────────────────────────────────
SELECT UUID(), n1.id, n2.id,  40.01, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-centro-2'               WHERE n1.code='n-pasillo-centro-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  24.19, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-centro-computo'          WHERE n1.code='n-pasillo-centro-2' UNION ALL
SELECT UUID(), n1.id, n2.id,  44.05, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-central-oeste'          WHERE n1.code='n-pasillo-centro-2' UNION ALL
SELECT UUID(), n1.id, n2.id,  45.04, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-postgrado-1'            WHERE n1.code='n-pasillo-central-oeste' UNION ALL

-- ── Centro de Cómputo y corredor H ───────────────────────────
SELECT UUID(), n1.id, n2.id,  32.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-esquina-cc-h'                   WHERE n1.code='n-acceso-centro-computo' UNION ALL
SELECT UUID(), n1.id, n2.id,  16.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-cruce-sur-cc'                   WHERE n1.code='n-acceso-centro-computo' UNION ALL
SELECT UUID(), n1.id, n2.id,  20.59, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-doctorado-1'            WHERE n1.code='n-acceso-centro-computo' UNION ALL
SELECT UUID(), n1.id, n2.id,  52.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-h-1'                   WHERE n1.code='n-esquina-cc-h' UNION ALL
SELECT UUID(), n1.id, n2.id,  35.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-h-1b'                  WHERE n1.code='n-pasillo-h-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  35.06, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-h-2'                   WHERE n1.code='n-pasillo-h-1b' UNION ALL
SELECT UUID(), n1.id, n2.id,  64.78, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-h-3'                   WHERE n1.code='n-pasillo-h-2' UNION ALL
SELECT UUID(), n1.id, n2.id,  34.23, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-h'                      WHERE n1.code='n-pasillo-h-3' UNION ALL
SELECT UUID(), n1.id, n2.id,  64.28, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-i-1'                   WHERE n1.code='n-pasillo-h-3' UNION ALL
SELECT UUID(), n1.id, n2.id,  38.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-cruce-h-f'                     WHERE n1.code='n-pasillo-h-3' UNION ALL
SELECT UUID(), n1.id, n2.id,  34.93, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-f-1'                   WHERE n1.code='n-cruce-h-f' UNION ALL

-- ── Zona I / J / Edificio Nuevo ──────────────────────────────
SELECT UUID(), n1.id, n2.id,  21.54, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-i-2'                   WHERE n1.code='n-pasillo-i-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  30.59, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-zona-gik'               WHERE n1.code='n-pasillo-i-1' UNION ALL
SELECT UUID(), n1.id, n2.id,   4.47, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-i'                      WHERE n1.code='n-pasillo-i-2' UNION ALL
SELECT UUID(), n1.id, n2.id,  18.44, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-j'                     WHERE n1.code='n-pasillo-i-2' UNION ALL
SELECT UUID(), n1.id, n2.id,   8.25, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-edificio-nuevo'          WHERE n1.code='n-pasillo-i-2' UNION ALL
SELECT UUID(), n1.id, n2.id,  10.63, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-j'                      WHERE n1.code='n-pasillo-j' UNION ALL

-- ── Zona E / F / G / K ───────────────────────────────────────
SELECT UUID(), n1.id, n2.id,  45.12, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-e'                      WHERE n1.code='n-pasillo-e-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  66.12, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-f-1'                   WHERE n1.code='n-pasillo-e-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  18.44, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-cafeteria-1'            WHERE n1.code='n-pasillo-e-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  10.77, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-f'                      WHERE n1.code='n-pasillo-f-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.07, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-g-1'                   WHERE n1.code='n-pasillo-f-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  13.42, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-g'                      WHERE n1.code='n-pasillo-g-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  21.54, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-zona-gik'               WHERE n1.code='n-pasillo-g-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  46.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-k-1'                   WHERE n1.code='n-pasillo-g-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  40.45, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-edificio-nuevo'          WHERE n1.code='n-pasillo-zona-gik' UNION ALL

-- ── Audiovisual Licenciatura ──────────────────────────────────
SELECT UUID(), n1.id, n2.id,  18.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-audiovisual-lic'        WHERE n1.code='n-acceso-audiovisual' UNION ALL

-- ── Zona Cafetería / Q / Gimnasio / Industrial / K / S ───────
SELECT UUID(), n1.id, n2.id,  31.62, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-cafeteria'               WHERE n1.code='n-pasillo-cafeteria-1' UNION ALL
-- (diagonal cafeteria-1 → q-1 eliminada; ahora: cafeteria-1 → gimnasio-1 → q-1)
SELECT UUID(), n1.id, n2.id,  28.43, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-q'                      WHERE n1.code='n-pasillo-q-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  26.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-gimnasio-1'             WHERE n1.code='n-pasillo-q-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  26.83, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-industrial-1'           WHERE n1.code='n-acceso-q' UNION ALL
SELECT UUID(), n1.id, n2.id,  14.14, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-lab-industrial'          WHERE n1.code='n-pasillo-industrial-1' UNION ALL
-- (diagonal industrial-1 → k-1 eliminada; sustituida por L a través de esquina-industrial-k)
SELECT UUID(), n1.id, n2.id,  12.17, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-k'                      WHERE n1.code='n-pasillo-k-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  18.87, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-aulas-s-1'              WHERE n1.code='n-pasillo-k-1' UNION ALL
SELECT UUID(), n1.id, n2.id,   8.94, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-aulas-s'                 WHERE n1.code='n-pasillo-aulas-s-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  11.66, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-gimnasio'                WHERE n1.code='n-pasillo-gimnasio-1' UNION ALL

-- ── Zona Físico-Química / L / X / X001 / C / B ───────────────
SELECT UUID(), n1.id, n2.id,   4.47, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-fisico-quimica'          WHERE n1.code='n-pasillo-fisico-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.07, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-c-1'                   WHERE n1.code='n-pasillo-fisico-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.07, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-l-1'                   WHERE n1.code='n-acceso-fisico-quimica' UNION ALL
SELECT UUID(), n1.id, n2.id,  16.12, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-l'                      WHERE n1.code='n-pasillo-l-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-x-1'                   WHERE n1.code='n-pasillo-l-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  12.17, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-x'                      WHERE n1.code='n-pasillo-x-1' UNION ALL
-- (diagonal x-1 → x001-1 eliminada; ahora: x-1 → l-1 (existente) → x001-1 (nueva arista más abajo))
SELECT UUID(), n1.id, n2.id,   8.94, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-x001'                   WHERE n1.code='n-pasillo-x001-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  54.15, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-b-1'                   WHERE n1.code='n-pasillo-x001-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  12.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-c'                      WHERE n1.code='n-pasillo-c-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.28, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-b-1'                   WHERE n1.code='n-pasillo-c-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  11.66, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-b'                      WHERE n1.code='n-pasillo-b-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  36.06, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-sala-1'                WHERE n1.code='n-pasillo-b-1' UNION ALL

-- ── Zona Sala / 1007 / 1008 / 1009 / Geolocalización ─────────
SELECT UUID(), n1.id, n2.id,  16.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-sala-titulacion'         WHERE n1.code='n-pasillo-sala-1' UNION ALL
-- (diagonal sala-1 → 1007-1 eliminada; sustituida por L a través de esquina-sala-1007)
SELECT UUID(), n1.id, n2.id,  64.12, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-1008-1'                WHERE n1.code='n-pasillo-sala-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  15.62, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-1007'                   WHERE n1.code='n-pasillo-1007-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  16.49, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-1008'                   WHERE n1.code='n-pasillo-1008-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  15.23, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-geolocalizacion'         WHERE n1.code='n-pasillo-1008-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  36.06, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-1009-1'                WHERE n1.code='n-acceso-geolocalizacion' UNION ALL
SELECT UUID(), n1.id, n2.id,   8.94, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-1009'                   WHERE n1.code='n-pasillo-1009-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  29.73, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-postgrado-1'            WHERE n1.code='n-pasillo-1009-1' UNION ALL

-- ── Zona Posgrado / Lab. Química / Lab. Eléctrica ─────────────
SELECT UUID(), n1.id, n2.id,  12.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-postgrado'               WHERE n1.code='n-pasillo-postgrado-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  30.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-lab-electrica'           WHERE n1.code='n-pasillo-postgrado-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  35.44, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-lab-quimica'             WHERE n1.code='n-acceso-postgrado' UNION ALL
SELECT UUID(), n1.id, n2.id,  24.41, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-postgrado-2'            WHERE n1.code='n-acceso-lab-quimica' UNION ALL
SELECT UUID(), n1.id, n2.id,  26.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-cruce-sur-cc'                   WHERE n1.code='n-pasillo-postgrado-2' UNION ALL
-- (diagonal postgrado-2 → lab-electrica eliminada; sustituida por L a través de esquina-postgrado-electrica)

-- ── Zona Doctorado / Electrónica / Audiovisual Post. / ENIE / QB ─
SELECT UUID(), n1.id, n2.id,  12.17, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-cubiculos-doctorado'     WHERE n1.code='n-pasillo-doctorado-1' UNION ALL
-- (diagonal doctorado-1 → electronica-1 eliminada; sustituida por L a través de esquina-doctorado-electronica)
SELECT UUID(), n1.id, n2.id,  34.93, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-quimica-bio-1'          WHERE n1.code='n-pasillo-doctorado-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  27.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-lab-civil'               WHERE n1.code='n-pasillo-doctorado-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  32.56, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-audiovisual-post-1'     WHERE n1.code='n-acceso-cubiculos-doctorado' UNION ALL
SELECT UUID(), n1.id, n2.id,  48.37, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-electronica'              WHERE n1.code='n-pasillo-electronica-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  25.61, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-audiovisual-post-1'     WHERE n1.code='n-pasillo-electronica-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.16, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-lab-civil'               WHERE n1.code='n-pasillo-electronica-1' UNION ALL
SELECT UUID(), n1.id, n2.id,   6.32, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-audiovisual-postgrado'   WHERE n1.code='n-pasillo-audiovisual-post-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  14.87, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-aulas-enie'              WHERE n1.code='n-pasillo-audiovisual-post-1' UNION ALL
-- (diagonal enie → quimica-bio eliminada; sustituida por L a través de esquina-enie-quimica)
SELECT UUID(), n1.id, n2.id,  29.07, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-quimica-bioquimica'      WHERE n1.code='n-pasillo-quimica-bio-1' UNION ALL

-- ── Pasillo central norte-sur (1) ────────────────────────────
-- Une cruce-h-f (z=74) con esquina-dir-centro (z=28) — paso del corredor H hacia Biblioteca
-- Sin este edge la A* daba vuelta por zona E/F (+70 unidades innecesarias)
SELECT UUID(), n1.id, n2.id,  46.04, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-esquina-dir-centro'             WHERE n1.code='n-cruce-h-f' UNION ALL

-- ── Aristas en L — esquinas originales (8) ────────────────────
-- Fix 1: dir-biblioteca → esquina → cruce
SELECT UUID(), n1.id, n2.id,  42.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-esquina-dir-centro'             WHERE n1.code='n-pasillo-direccion-biblioteca' UNION ALL
SELECT UUID(), n1.id, n2.id,  36.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-cruce-biblioteca-centro'        WHERE n1.code='n-esquina-dir-centro' UNION ALL
-- Fix 2: sala-1 → esquina → 1007-1
SELECT UUID(), n1.id, n2.id,  38.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-esquina-sala-1007'              WHERE n1.code='n-pasillo-sala-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  26.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-1007-1'                 WHERE n1.code='n-esquina-sala-1007' UNION ALL
-- Fix 3: postgrado-2 → esquina → lab-electrica
SELECT UUID(), n1.id, n2.id,  48.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-esquina-postgrado-electrica'    WHERE n1.code='n-pasillo-postgrado-2' UNION ALL
SELECT UUID(), n1.id, n2.id,  20.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-lab-electrica'           WHERE n1.code='n-esquina-postgrado-electrica' UNION ALL
-- Fix 4: enie → esquina → quimica-bio
SELECT UUID(), n1.id, n2.id,  26.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-esquina-enie-quimica'           WHERE n1.code='n-acceso-aulas-enie' UNION ALL
SELECT UUID(), n1.id, n2.id,  49.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-quimica-bio-1'          WHERE n1.code='n-esquina-enie-quimica' UNION ALL

-- ── Aristas nuevas (6) — diagonales adicionales corregidas ────
-- Fix 5: cafeteria-1 → gimnasio-1 (puente horizontal z=28, evita diagonal a q-1)
SELECT UUID(), n1.id, n2.id,  38.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-gimnasio-1'             WHERE n1.code='n-pasillo-cafeteria-1' UNION ALL
-- Fix 6: l-1 → x001-1 (bajada vertical desde corredor z=-16 hacia x001)
SELECT UUID(), n1.id, n2.id,  30.59, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-x001-1'                WHERE n1.code='n-pasillo-l-1' UNION ALL
-- Fix 7: doctorado-1 → esquina → electronica-1
SELECT UUID(), n1.id, n2.id,  28.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-esquina-doctorado-electronica'  WHERE n1.code='n-pasillo-doctorado-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  24.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-electronica-1'          WHERE n1.code='n-esquina-doctorado-electronica' UNION ALL
-- Fix 8: industrial-1 → esquina → k-1
SELECT UUID(), n1.id, n2.id,  22.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-esquina-industrial-k'           WHERE n1.code='n-pasillo-industrial-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  38.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-k-1'                   WHERE n1.code='n-esquina-industrial-k';

-- ============================================================
-- BUILDING ENTRANCES: 38
-- Requiere que todos los buildings ya existan ()
-- ============================================================
INSERT INTO building_entrances (id, building_id, node_id, entrance_name, entrance_type, is_primary, is_accessible)
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-direccion'             WHERE b.slug='direccion' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-biblioteca'            WHERE b.slug='biblioteca' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-centro-computo'        WHERE b.slug='centro-computo' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-h'                    WHERE b.slug='edificio-h' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-i'                    WHERE b.slug='edificio-i' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-j'                    WHERE b.slug='edificio-j' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-e'                    WHERE b.slug='edificio-e' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-f'                    WHERE b.slug='edificio-f' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-g'                    WHERE b.slug='edificio-g' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-audiovisual'           WHERE b.slug='audiovisual-licenciatura' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-edificio-nuevo'        WHERE b.slug='edificio-nuevo' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-cafeteria'             WHERE b.slug='cafeteria' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-gimnasio'              WHERE b.slug='gimnasio' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-q'                    WHERE b.slug='edificio-q' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-lab-industrial'        WHERE b.slug='laboratorio-ingenieria-industrial' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-aulas-s'               WHERE b.slug='aulas-s' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-k'                    WHERE b.slug='edificio-k' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-l'                    WHERE b.slug='edificio-l' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-x'                    WHERE b.slug='edificiox' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-x001'                 WHERE b.slug='edificiox001' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-c'                    WHERE b.slug='edificio-c' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-b'                    WHERE b.slug='edificio-b' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-fisico-quimica'        WHERE b.slug='fisico-quimica' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-sala-titulacion'       WHERE b.slug='sala-titulacion' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-1007'                  WHERE b.slug='1007' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-1008'                  WHERE b.slug='1008' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-geolocalizacion'       WHERE b.slug='geolocalizacion' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-1009'                  WHERE b.slug='1009' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-postgrado'             WHERE b.slug='postgrado' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-lab-quimica'           WHERE b.slug='lab-quimica' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-lab-electrica'         WHERE b.slug='lab-electrica' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-quimica-bioquimica'    WHERE b.slug='depto-quimica-bioquimica' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-asesorias'             WHERE b.slug='asesorias' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-cubiculos-doctorado'   WHERE b.slug='cubiculos-doctorado' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-electronica'           WHERE b.slug='depto-electronica' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-audiovisual-postgrado' WHERE b.slug='audiovisual-postgrado' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-aulas-enie'            WHERE b.slug='aulas-enie' UNION ALL
SELECT UUID(), b.id, n.id, NULL, 'main', 1, 1 FROM buildings b JOIN navigation_nodes n ON n.code='n-acceso-lab-civil'             WHERE b.slug='lab-civil';

-- ============================================================
-- VERIFICACIÓN (ejecutar después)
-- ============================================================
-- SELECT COUNT(*) AS nodos    FROM navigation_nodes;    -- esperado: 86
-- SELECT COUNT(*) AS aristas  FROM navigation_edges;    -- esperado: 97
-- SELECT COUNT(*) AS entradas FROM building_entrances;  -- esperado: 38
