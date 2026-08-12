-- Vincula trámites/constancias con los edificios donde se atienden,
-- según ubicación confirmada directamente por el usuario (no son
-- suposiciones, ver docs/seed-campus-discovery-20260805.sql donde
-- estos mismos procedures se cargaron sin building_id/department_id
-- "sin confirmación formal").
--
-- Aplicar con: psql -U postgres -d mapa_ito -f docs/migration-vincular-tramites-edificios-20260812.sql
BEGIN;

-- ============================================================
-- Departamentos nuevos mencionados por el usuario, aún no existían
-- ============================================================
INSERT INTO departments (id, building_id, name, is_active)
SELECT gen_random_uuid(), b.id, d.name, TRUE
FROM (VALUES
  ('DIR', 'Servicio Social'),
  ('DIR', 'Coordinación')
) AS d(building_code, name)
JOIN buildings b ON b.code = d.building_code AND b.is_active = TRUE AND b.deleted_at IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM departments ex
  WHERE ex.building_id = b.id AND ex.name = d.name AND ex.deleted_at IS NULL
);

-- Departamento de Servicios Escolares: el usuario confirmó que, para
-- fines de ubicación de trámites, se trata como parte de DIR (aunque
-- también existe el edificio SERV-ESC por separado en el sistema,
-- casi en la misma posición física — ver ronda 2026-07-15 en memoria).
INSERT INTO departments (id, building_id, name, is_active)
SELECT gen_random_uuid(), b.id, 'Servicios Escolares', TRUE
FROM buildings b
WHERE b.code = 'DIR' AND b.is_active = TRUE AND b.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM departments ex
    WHERE ex.building_id = b.id AND ex.name = 'Servicios Escolares' AND ex.deleted_at IS NULL
  );

-- ============================================================
-- building_procedures: vínculo trámite -> edificio
-- ============================================================
INSERT INTO building_procedures (building_id, procedure_id, notes)
SELECT b.id, p.id, l.notes
FROM (VALUES
  ('constancia-terminacion-ingles',            'H',   'Coordinación de Lenguas Extranjeras'),
  ('constancia-terminacion-servicio-social',   'DIR', 'Departamento de Servicio Social'),
  ('expedicion-constancia-estudios',           'DIR', 'Departamento de Coordinación'),
  ('constancia-actividades-complementarias',   'GIM', NULL)
) AS l(procedure_slug, building_code, notes)
JOIN procedures p ON p.slug = l.procedure_slug AND p.deleted_at IS NULL
JOIN buildings  b ON b.code = l.building_code AND b.is_active = TRUE AND b.deleted_at IS NULL
ON CONFLICT (building_id, procedure_id) DO NOTHING;

-- Ubicación confirmada directamente por el usuario -> ya no quedan
-- "sin confirmación formal" como se cargaron en 20260805.
UPDATE procedures
SET validation_status = 'confirmed'
WHERE slug IN (
  'constancia-terminacion-ingles',
  'constancia-terminacion-servicio-social',
  'expedicion-constancia-estudios',
  'constancia-actividades-complementarias'
);

COMMIT;
