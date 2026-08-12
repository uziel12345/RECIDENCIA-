-- Completa procedures.department_id para los trámites vinculados en
-- migration-vincular-tramites-edificios-20260812.sql, que solo dejó el
-- nombre del departamento como texto libre en building_procedures.notes.
-- Con department_id ya resoluble, la UI puede anidar cada trámite dentro
-- de la tarjeta de su departamento en vez de una lista plana aparte.
--
-- No toca "Constancia de actividades complementarias" (GIM): ese edificio
-- no tiene un departamento propio registrado, así que se sigue mostrando
-- en la lista de "Trámites y servicios" sin agrupar.
--
-- Aplicar con: psql -U postgres -d mapa_ito -f docs/migration-tramites-department-id-20260812.sql
BEGIN;

UPDATE procedures p
SET department_id = d.id
FROM (VALUES
  ('constancia-terminacion-ingles',          'H',   'Coordinación de Lenguas Extranjeras'),
  ('constancia-terminacion-servicio-social', 'DIR', 'Servicio Social'),
  ('expedicion-constancia-estudios',         'DIR', 'Coordinación')
) AS l(procedure_slug, building_code, department_name)
JOIN buildings   b ON b.code = l.building_code AND b.is_active = TRUE AND b.deleted_at IS NULL
JOIN departments d ON d.building_id = b.id AND d.name = l.department_name AND d.deleted_at IS NULL
WHERE p.slug = l.procedure_slug;

COMMIT;
