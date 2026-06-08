-- ============================================================
-- SEED MÍNIMO — Mapa 3D ITO
-- Generado: 2026-06-08
--
-- Prerequisito: schema.sql ya ejecutado (incluye las categorías).
--
-- Uso:
--   mysql -u <usuario> -p mapa_ito < docs/seed.sql
--
-- IMPORTANTE — Contraseña del superadmin:
--   El hash de abajo es un MARCADOR (no corresponde a ninguna contraseña real).
--   Para generar un hash real, ejecuta:
--     node -e "require('bcryptjs').hash('TuContraseñaSegura@123', 12).then(h => console.log(h))"
--   Luego reemplaza el valor del campo password_hash con el resultado.
-- ============================================================

SET NAMES utf8mb4;

-- ============================================================
-- Usuario superadmin de ejemplo
-- Hash marcador — debe reemplazarse antes de usar en producción
-- ============================================================
INSERT IGNORE INTO admin_users
  (id, username, full_name, email, password_hash, role, is_active,
   failed_login_attempts, locked_until, token_version)
VALUES (
  UUID(),
  'superadmin',
  'Super Administrador ITO',
  'admin@ito.edu.mx',
  -- MARCADOR: ejecuta el comando del encabezado para obtener un hash real
  '$2b$12$AAAAAAAAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'superadmin',
  1, 0, NULL, 1
);

-- ============================================================
-- Edificios de ejemplo (usan categorías ya insertadas por schema.sql)
-- ============================================================
INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name,
   x, y, z, is_active, is_priority)
SELECT UUID(), bc.id,
  'DIR', 'Dirección', 'direccion',
  'Edificio de Dirección General del ITO',
  'Edificio_Direccion', -78, 0, 60, 1, 1
FROM building_categories bc WHERE bc.code = 'administrativo'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'DIR');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name,
   x, y, z, is_active, is_priority)
SELECT UUID(), bc.id,
  'BIB', 'Biblioteca', 'biblioteca',
  'Biblioteca del Instituto Tecnológico de Oaxaca',
  'Biblioteca_', 8, 0, 0, 1, 1
FROM building_categories bc WHERE bc.code = 'biblioteca'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'BIB');

INSERT IGNORE INTO buildings
  (id, category_id, code, name, slug, description, model_node_name,
   x, y, z, is_active, is_priority)
SELECT UUID(), bc.id,
  'CC', 'Centro de Cómputo', 'centro-computo',
  'Centro de Cómputo y Sistemas',
  'Centro_Computo', 2, 0, -112, 1, 0
FROM building_categories bc WHERE bc.code = 'laboratorio'
  AND NOT EXISTS (SELECT 1 FROM buildings b WHERE b.code = 'CC');

-- ============================================================
-- Nodos de navegación de ejemplo
-- ============================================================
INSERT IGNORE INTO navigation_nodes
  (id, code, name, node_type, x, y, z, floor_level, is_walkable, is_active)
VALUES
  (UUID(), 'n-acceso-direccion',         'Acceso Dirección',         'entrance',     -78, 0,   50, 0, 1, 1),
  (UUID(), 'n-acceso-biblioteca',        'Acceso Biblioteca',        'entrance',       8, 0,    0, 0, 1, 1),
  (UUID(), 'n-cruce-biblioteca-centro',  'Cruce Biblioteca - Centro','intersection',  -6, 0,   -8, 0, 1, 1);

-- ============================================================
-- Arista de ejemplo entre dirección y cruce
-- ============================================================
INSERT IGNORE INTO navigation_edges
  (id, from_node_id, to_node_id, distance, is_bidirectional, is_accessible, path_type, is_active)
SELECT UUID(), n1.id, n2.id, 66.40, 1, 1, 'sidewalk', 1
FROM navigation_nodes n1 JOIN navigation_nodes n2
  ON n1.code = 'n-acceso-direccion'
 AND n2.code = 'n-cruce-biblioteca-centro'
WHERE NOT EXISTS (
  SELECT 1 FROM navigation_edges e
   WHERE e.from_node_id = n1.id AND e.to_node_id = n2.id
);
