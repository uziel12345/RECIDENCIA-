-- ============================================================
-- MIGRACIÓN: Consolidar "Servicios/Departamentos" en el catálogo
-- de trámites/servicios (procedures + building_procedures)
-- Fecha: 2026-07-07
--
-- Contexto: building_services era una lista de texto libre POR EDIFICIO,
-- sin catálogo compartido, y no se mostraba en ningún lugar público (ni en
-- el buscador ni en la ficha del edificio). El buscador YA usaba
-- procedures(kind='servicio') + building_procedures para el kind "service".
-- Esta migración copia cada servicio existente a ese catálogo (deduplicando
-- por nombre, para que un mismo servicio ofrecido por varios edificios sea
-- UNA sola fila reutilizable) y luego elimina la tabla vieja.
--
-- IMPORTANTE: MySQL no tiene una forma nativa sencilla de generar slugs con
-- acentos (á→a, é→e, etc.) en una sola expresión. Este script cubre los
-- acentos españoles comunes; si algún nombre produce un slug duplicado, la
-- restricción UNIQUE de `procedures.slug` hará fallar el INSERT — en ese
-- caso, ejecuta la migración por partes o ajusta el slug manualmente antes
-- de reintentar.
-- ============================================================

-- 1. Un procedure (kind='servicio') por cada nombre distinto en
--    building_services, usando la primera descripción no nula como
--    descripción de catálogo.
INSERT INTO procedures (id, name, slug, description, kind, is_active)
SELECT
  UUID(),
  g.name,
  TRIM(BOTH '-' FROM
    LOWER(
      REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        REPLACE(TRIM(g.name), ' ', '-'),
      'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u'),'ñ','n'),'ü','u'),
      'Á','a'),'É','e'),'Í','i')
    )
  ) AS slug,
  g.description,
  'servicio',
  1
FROM (
  SELECT DISTINCT
    bs.name AS name,
    (
      SELECT bs2.description FROM building_services bs2
      WHERE bs2.name = bs.name AND bs2.description IS NOT NULL
      ORDER BY bs2.id ASC LIMIT 1
    ) AS description
  FROM building_services bs
) g
WHERE NOT EXISTS (
  SELECT 1 FROM procedures p
  WHERE p.kind = 'servicio' AND p.name = g.name AND p.deleted_at IS NULL
);

-- 2. Vincular cada edificio que tenía el servicio al procedure resultante.
--    El texto original por edificio se conserva como `notes` sólo si
--    difiere de la descripción de catálogo (para no duplicar información).
INSERT INTO building_procedures (building_id, procedure_id, notes)
SELECT
  bs.building_id,
  p.id,
  CASE
    WHEN bs.description IS NOT NULL AND bs.description <> p.description THEN bs.description
    ELSE NULL
  END
FROM building_services bs
INNER JOIN procedures p ON p.kind = 'servicio' AND p.name = bs.name AND p.deleted_at IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM building_procedures bp
  WHERE bp.building_id = bs.building_id AND bp.procedure_id = p.id
);

-- 3. Eliminar la tabla vieja: su contenido ya vive en procedures +
--    building_procedures, y ningún endpoint la usa después de esta ronda.
DROP TABLE IF EXISTS building_services;
