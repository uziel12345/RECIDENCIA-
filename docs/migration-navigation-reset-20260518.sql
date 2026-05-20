-- Reset completo de navegación
-- Fecha: 2026-05-18
-- Fuente: apps/web/src/features/buildings/navigation/data/campusNodes.ts
-- Nodos: 80 | Aristas: 91 (bidireccionales)
-- Distancias: sqrt((x2-x1)^2 + (z2-z1)^2) desde coordenadas del grafo

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE navigation_edges;
TRUNCATE TABLE navigation_nodes;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- NODOS
-- ============================================================
INSERT INTO navigation_nodes (id, code, name, node_type, x, y, z, latitude, longitude, floor_level, is_walkable, is_active, metadata, created_at, updated_at) VALUES
(UUID(), 'n-acceso-direccion',           'Acceso Dirección',               'entrance',     -78,  0,   50, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-direccion-biblioteca','Pasillo Dirección - Biblioteca', 'waypoint',     -48,  0,   28, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-biblioteca',          'Acceso Biblioteca',              'entrance',       8,  0,    0, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-cruce-biblioteca-centro',    'Cruce Biblioteca - Centro',      'intersection',  -6,  0,   -8, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-centro-1',           'Pasillo Centro 1',               'waypoint',      -2,  0,  -48, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-centro-2',           'Pasillo Centro 2',               'intersection',  -1,  0,  -88, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-central-oeste',      'Pasillo Central Oeste',          'waypoint',     -45,  0,  -90, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-centro-computo',      'Acceso Centro de Cómputo',       'entrance',       2,  0, -112, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-esquina-cc-h',              'Esquina CC - H',                  'intersection', -30,  0, -112, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-h-1',               'Pasillo H-1',                     'waypoint',     -30,  0,  -60, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-h-1b',              'Pasillo H-1B',                    'waypoint',     -30,  0,  -25, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-h-2',               'Pasillo H-2',                     'waypoint',     -32,  0,   10, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-h-3',               'Pasillo H-3',                     'intersection', -42,  0,   74, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-cruce-h-f',                 'Cruce H - F',                     'intersection',  -4,  0,   74, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-h',                  'Acceso Edificio H',               'entrance',     -38,  0,  108, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-i-1',               'Pasillo I-1',                     'intersection', -48,  0,  138, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-i-2',               'Pasillo I-2',                     'intersection', -56,  0,  158, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-i',                  'Acceso Edificio I',               'entrance',     -54,  0,  162, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-j',                 'Pasillo J',                       'waypoint',     -42,  0,  170, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-j',                  'Acceso Edificio J',               'entrance',     -35,  0,  162, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-e-1',               'Pasillo E-1',                     'intersection',   0,  0,   42, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-e',                  'Acceso Edificio E',               'entrance',      10,  0,   86, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-f-1',               'Pasillo F-1',                     'intersection',   4,  0,  108, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-f',                  'Acceso Edificio F',               'entrance',       8,  0,  118, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-g-1',               'Pasillo G-1',                     'intersection',   2,  0,  136, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-g',                  'Acceso Edificio G',               'entrance',       8,  0,  148, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-zona-gik',          'Pasillo Zona G-I-K',              'intersection', -18,  0,  144, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-audiovisual',        'Acceso Audiovisual Licenciatura',  'entrance',     -40,  0,    5, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-audiovisual-lic',   'Pasillo Audiovisual Licenciatura', 'waypoint',     -22,  0,    5, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-edificio-nuevo',     'Acceso Edificio Nuevo',            'entrance',     -58,  0,  150, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-cafeteria-1',       'Pasillo Cafetería-1',              'intersection',  12,  0,   28, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-cafeteria',          'Acceso Cafetería',                 'entrance',      22,  0,   58, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-q-1',               'Pasillo Q-1',                     'intersection',  40,  0,   52, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-q',                  'Acceso Edificio Q',               'entrance',      58,  0,   74, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-industrial-1',      'Pasillo Industrial-1',             'intersection',  70,  0,   98, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-lab-industrial',     'Acceso Lab. Industrial',           'entrance',      72,  0,  112, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-k-1',               'Pasillo K-1',                     'intersection',  48,  0,  136, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-k',                  'Acceso Edificio K',               'entrance',      46,  0,  148, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-aulas-s-1',         'Pasillo Aulas S-1',               'waypoint',      58,  0,  152, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-aulas-s',            'Acceso Aulas S',                  'entrance',      62,  0,  160, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-gimnasio-1',        'Pasillo Gimnasio-1',               'waypoint',      50,  0,   28, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-gimnasio',           'Acceso Gimnasio',                  'entrance',      56,  0,   18, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-fisico-1',          'Pasillo Físico-Química',           'intersection', -18,  0,  -16, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-fisico-quimica',     'Acceso Físico-Química',            'entrance',     -22,  0,  -18, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-l-1',               'Pasillo L-1',                     'intersection',   6,  0,  -16, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-l',                  'Acceso Edificio L',               'entrance',      22,  0,  -18, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-x-1',               'Pasillo X-1',                     'intersection',  34,  0,  -16, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-x',                  'Acceso Edificio X',               'entrance',      46,  0,  -14, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-x001-1',            'Pasillo X001-1',                  'intersection',  12,  0,  -46, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-x001',               'Acceso Edificio X001',            'entrance',       8,  0,  -54, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-c-1',               'Pasillo C-1',                     'intersection', -46,  0,  -14, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-c',                  'Acceso Edificio C',               'entrance',     -58,  0,  -14, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-b-1',               'Pasillo B-1',                     'intersection', -42,  0,  -42, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-b',                  'Acceso Edificio B',               'entrance',     -52,  0,  -48, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-sala-1',            'Pasillo Sala Titulación',          'intersection', -78,  0,  -44, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-sala-titulacion',    'Acceso Sala Titulación',           'entrance',     -94,  0,  -44, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-1007-1',            'Pasillo 1007-1',                  'waypoint',    -116,  0,  -18, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-1007',               'Acceso Aula 1007',                'entrance',    -128,  0,   -8, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-1008-1',            'Pasillo 1008-1',                  'intersection',-142,  0,  -48, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-1008',               'Acceso Aula 1008',                'entrance',    -158,  0,  -44, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-geolocalizacion',    'Acceso Geolocalización',           'entrance',    -148,  0,  -62, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-1009-1',            'Pasillo 1009-1',                  'intersection',-118,  0,  -82, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-1009',               'Acceso Aula 1009',                'entrance',    -114,  0,  -90, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-postgrado-1',       'Pasillo Posgrado-1',              'intersection', -90,  0,  -92, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-postgrado',          'Acceso Posgrado',                  'entrance',     -78,  0,  -92, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-lab-quimica',        'Acceso Lab. Química',              'entrance',     -44,  0,  -82, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-postgrado-2',       'Pasillo Posgrado-2',              'waypoint',     -24,  0,  -96, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-lab-electrica',      'Acceso Lab. Eléctrica',            'entrance',     -72,  0, -116, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-cruce-sur-cc',              'Cruce Sur CC',                     'intersection',   2,  0,  -96, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-doctorado-1',       'Pasillo Doctorado-1',             'intersection',  20,  0, -122, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-cubiculos-doctorado','Acceso Cubículos Doctorado',       'entrance',      32,  0, -124, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-electronica-1',     'Pasillo Electrónica-1',           'intersection',  48,  0,  -98, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-electronica',        'Acceso Electrónica',               'entrance',      54,  0,  -50, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-audiovisual-post-1','Pasillo Audiovisual Posgrado-1',   'intersection',  64,  0, -118, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-audiovisual-postgrado','Acceso Audiovisual Posgrado',    'entrance',      70,  0, -116, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-aulas-enie',         'Acceso Aulas ENIE',               'entrance',      54,  0, -107, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-pasillo-quimica-bio-1',     'Pasillo Química-Bio-1',           'intersection',  28,  0, -156, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-quimica-bioquimica', 'Acceso Química y Bioquímica',      'entrance',      26,  0, -127, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-asesorias',          'Acceso Asesorías',                 'entrance',      12,  0,   -4, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW()),
(UUID(), 'n-acceso-lab-civil',          'Acceso Lab. Civil',                'entrance',      20,  0,  -95, NULL, NULL, 0, 1, 1, NULL, NOW(), NOW());

-- ============================================================
-- ARISTAS (bidireccionales, distancia en unidades del grafo)
-- ============================================================
INSERT INTO navigation_edges (id, from_node_id, to_node_id, distance, is_bidirectional, is_accessible, path_type, is_active, created_at, updated_at)
SELECT UUID(), n1.id, n2.id,  37.20, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-direccion-biblioteca'  WHERE n1.code='n-acceso-direccion' UNION ALL
SELECT UUID(), n1.id, n2.id,  55.32, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-cruce-biblioteca-centro'        WHERE n1.code='n-pasillo-direccion-biblioteca' UNION ALL
SELECT UUID(), n1.id, n2.id,  16.12, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-cruce-biblioteca-centro'        WHERE n1.code='n-acceso-biblioteca' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.28, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-cafeteria-1'            WHERE n1.code='n-acceso-biblioteca' UNION ALL
SELECT UUID(), n1.id, n2.id,  40.20, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-centro-1'               WHERE n1.code='n-cruce-biblioteca-centro' UNION ALL
SELECT UUID(), n1.id, n2.id,  50.36, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-e-1'                   WHERE n1.code='n-cruce-biblioteca-centro' UNION ALL
SELECT UUID(), n1.id, n2.id,  14.42, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-fisico-1'               WHERE n1.code='n-cruce-biblioteca-centro' UNION ALL
SELECT UUID(), n1.id, n2.id,  20.62, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-audiovisual-lic'        WHERE n1.code='n-cruce-biblioteca-centro' UNION ALL
SELECT UUID(), n1.id, n2.id,  40.01, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-centro-2'               WHERE n1.code='n-pasillo-centro-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  24.19, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-centro-computo'          WHERE n1.code='n-pasillo-centro-2' UNION ALL
SELECT UUID(), n1.id, n2.id,  44.05, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-central-oeste'          WHERE n1.code='n-pasillo-centro-2' UNION ALL
SELECT UUID(), n1.id, n2.id,  45.04, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-postgrado-1'            WHERE n1.code='n-pasillo-central-oeste' UNION ALL
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
SELECT UUID(), n1.id, n2.id,  21.54, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-i-2'                   WHERE n1.code='n-pasillo-i-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  30.59, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-zona-gik'               WHERE n1.code='n-pasillo-i-1' UNION ALL
SELECT UUID(), n1.id, n2.id,   4.47, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-i'                      WHERE n1.code='n-pasillo-i-2' UNION ALL
SELECT UUID(), n1.id, n2.id,  18.44, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-j'                     WHERE n1.code='n-pasillo-i-2' UNION ALL
SELECT UUID(), n1.id, n2.id,   8.25, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-edificio-nuevo'          WHERE n1.code='n-pasillo-i-2' UNION ALL
SELECT UUID(), n1.id, n2.id,  10.63, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-j'                      WHERE n1.code='n-pasillo-j' UNION ALL
SELECT UUID(), n1.id, n2.id,  45.12, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-e'                      WHERE n1.code='n-pasillo-e-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  66.12, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-f-1'                   WHERE n1.code='n-pasillo-e-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  18.44, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-cafeteria-1'            WHERE n1.code='n-pasillo-e-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  10.77, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-f'                      WHERE n1.code='n-pasillo-f-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.07, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-g-1'                   WHERE n1.code='n-pasillo-f-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  13.42, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-g'                      WHERE n1.code='n-pasillo-g-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  21.54, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-zona-gik'               WHERE n1.code='n-pasillo-g-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  46.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-k-1'                   WHERE n1.code='n-pasillo-g-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  40.45, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-edificio-nuevo'          WHERE n1.code='n-pasillo-zona-gik' UNION ALL
SELECT UUID(), n1.id, n2.id,  18.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-audiovisual-lic'        WHERE n1.code='n-acceso-audiovisual' UNION ALL
SELECT UUID(), n1.id, n2.id,  31.62, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-cafeteria'               WHERE n1.code='n-pasillo-cafeteria-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  36.88, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-q-1'                   WHERE n1.code='n-pasillo-cafeteria-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.43, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-q'                      WHERE n1.code='n-pasillo-q-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  26.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-gimnasio-1'             WHERE n1.code='n-pasillo-q-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  26.83, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-industrial-1'           WHERE n1.code='n-acceso-q' UNION ALL
SELECT UUID(), n1.id, n2.id,  14.14, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-lab-industrial'          WHERE n1.code='n-pasillo-industrial-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  43.91, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-k-1'                   WHERE n1.code='n-pasillo-industrial-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  12.17, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-k'                      WHERE n1.code='n-pasillo-k-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  18.87, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-aulas-s-1'              WHERE n1.code='n-pasillo-k-1' UNION ALL
SELECT UUID(), n1.id, n2.id,   8.94, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-aulas-s'                 WHERE n1.code='n-pasillo-aulas-s-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  11.66, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-gimnasio'                WHERE n1.code='n-pasillo-gimnasio-1' UNION ALL
SELECT UUID(), n1.id, n2.id,   4.47, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-fisico-quimica'          WHERE n1.code='n-pasillo-fisico-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.07, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-c-1'                   WHERE n1.code='n-pasillo-fisico-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.07, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-l-1'                   WHERE n1.code='n-acceso-fisico-quimica' UNION ALL
SELECT UUID(), n1.id, n2.id,  16.12, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-l'                      WHERE n1.code='n-pasillo-l-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-x-1'                   WHERE n1.code='n-pasillo-l-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  12.17, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-x'                      WHERE n1.code='n-pasillo-x-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  37.20, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-x001-1'                WHERE n1.code='n-pasillo-x-1' UNION ALL
SELECT UUID(), n1.id, n2.id,   8.94, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-x001'                   WHERE n1.code='n-pasillo-x001-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  54.15, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-b-1'                   WHERE n1.code='n-pasillo-x001-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  12.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-c'                      WHERE n1.code='n-pasillo-c-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.28, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-b-1'                   WHERE n1.code='n-pasillo-c-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  11.66, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-b'                      WHERE n1.code='n-pasillo-b-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  36.06, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-sala-1'                WHERE n1.code='n-pasillo-b-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  16.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-sala-titulacion'         WHERE n1.code='n-pasillo-sala-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  46.04, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-1007-1'                WHERE n1.code='n-pasillo-sala-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  64.12, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-1008-1'                WHERE n1.code='n-pasillo-sala-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  15.62, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-1007'                   WHERE n1.code='n-pasillo-1007-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  16.49, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-1008'                   WHERE n1.code='n-pasillo-1008-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  15.23, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-geolocalizacion'         WHERE n1.code='n-pasillo-1008-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  36.06, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-1009-1'                WHERE n1.code='n-acceso-geolocalizacion' UNION ALL
SELECT UUID(), n1.id, n2.id,   8.94, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-1009'                   WHERE n1.code='n-pasillo-1009-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  29.73, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-postgrado-1'            WHERE n1.code='n-pasillo-1009-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  12.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-postgrado'               WHERE n1.code='n-pasillo-postgrado-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  30.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-lab-electrica'           WHERE n1.code='n-pasillo-postgrado-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  35.44, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-lab-quimica'             WHERE n1.code='n-acceso-postgrado' UNION ALL
SELECT UUID(), n1.id, n2.id,  24.41, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-postgrado-2'            WHERE n1.code='n-acceso-lab-quimica' UNION ALL
SELECT UUID(), n1.id, n2.id,  26.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-cruce-sur-cc'                   WHERE n1.code='n-pasillo-postgrado-2' UNION ALL
SELECT UUID(), n1.id, n2.id,  12.17, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-cubiculos-doctorado'     WHERE n1.code='n-pasillo-doctorado-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  36.88, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-electronica-1'          WHERE n1.code='n-pasillo-doctorado-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  34.93, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-quimica-bio-1'          WHERE n1.code='n-pasillo-doctorado-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  27.00, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-lab-civil'               WHERE n1.code='n-pasillo-doctorado-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  32.56, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-audiovisual-post-1'     WHERE n1.code='n-acceso-cubiculos-doctorado' UNION ALL
SELECT UUID(), n1.id, n2.id,  48.37, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-electronica'              WHERE n1.code='n-pasillo-electronica-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  25.61, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-audiovisual-post-1'     WHERE n1.code='n-pasillo-electronica-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  28.16, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-lab-civil'               WHERE n1.code='n-pasillo-electronica-1' UNION ALL
SELECT UUID(), n1.id, n2.id,   6.32, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-audiovisual-postgrado'   WHERE n1.code='n-pasillo-audiovisual-post-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  14.87, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-aulas-enie'              WHERE n1.code='n-pasillo-audiovisual-post-1' UNION ALL
SELECT UUID(), n1.id, n2.id,  55.47, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-pasillo-quimica-bio-1'          WHERE n1.code='n-acceso-aulas-enie' UNION ALL
SELECT UUID(), n1.id, n2.id,  29.07, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-quimica-bioquimica'      WHERE n1.code='n-pasillo-quimica-bio-1' UNION ALL
SELECT UUID(), n1.id, n2.id,   5.66, 1, 1, 'sidewalk', 1, NOW(), NOW() FROM navigation_nodes n1 JOIN navigation_nodes n2 ON n2.code='n-acceso-asesorias'               WHERE n1.code='n-acceso-biblioteca';

-- ============================================================
-- VERIFICACIÓN (ejecutar después del INSERT)
-- ============================================================
-- SELECT COUNT(*) AS total_nodos    FROM navigation_nodes;   -- esperado: 80
-- SELECT COUNT(*) AS total_aristas  FROM navigation_edges;   -- esperado: 91
