-- ============================================================
-- Correcciones tras auditoría de EDIFICIOS.pdf contra la BD (ronda
-- 2026-07-14), cruzando los 26 ítems del croquis contra classrooms/
-- departments/headquarters/teacher_cubicles cargados en la ronda
-- 2026-07-13 (migration-edificios-detalle-croquis-20260713.sql).
--
-- 1) Dato sucio pre-existente (detectado y NO corregido en la ronda
--    2026-07-13, ver esa migración): building "I" tenía 1 fila de
--    prueba (code='Aula', name='I-12', floor=2, created_at
--    2026-06-18) sobrante de una verificación E2E anterior — I12 real
--    ya existe correctamente en floor=1. Se soft-elimina.
--
-- 2) 5 edificios donde el ítem del croquis lista el propio
--    espacio/función del edificio junto a OTROS espacios distintos
--    (ej. item 13 "Lab. de ingeniería industrial, almacén"), pero solo
--    el otro espacio se cargó en la ronda anterior — el espacio que
--    coincide con el nombre del edificio se omitió por error:
--    - LAB-IND: faltaba "Laboratorio de Ingeniería Industrial" (solo
--      se cargó "Almacén").
--    - AUD-LIC: faltaba "Audiovisual de Licenciatura" (solo se cargó
--      "Delegación Sindical D-II").
--    - AUD-ING: faltaba "Audiovisual de Ingeniería" (solo se cargó
--      "Coordinación de Actividades Complementarias").
--    - FQ: faltaba el espacio físico "Laboratorio de Físico Química"
--      (solo existe la jefatura combinada "Jefatura — Laboratorio de
--      Físico Química"; igual que en Edificio Q, la jefatura y el
--      espacio físico son entidades separadas).
--    - CC: faltaba "Centro de Cómputo" (solo se cargaron
--      "Credenciales" y "Laboratorio de Cómputo" en planta baja).
--    Verificado por búsqueda de nombre en TODAS las tablas que estos
--    5 espacios no existían ya bajo otro edificio (no es un problema
--    de ubicación incorrecta, es una omisión real).
--
-- Fecha: 2026-07-14
-- Aplica con:
--   mysql -u <usuario> -p mapa_ito < docs/migration-fix-edificios-croquis-20260714.sql
-- ============================================================

-- 1) Soft-delete de la fila sucia de prueba en Edificio I
UPDATE classrooms
SET deleted_at = NOW()
WHERE building_id = 'a374c96b-3f3a-11f1-b497-d843ae05cb18'
  AND code = 'Aula' AND name = 'I-12' AND floor = 2
  AND deleted_at IS NULL;

-- 2) Espacios propios del edificio, omitidos en la carga anterior
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), id, 'LAB-ING-IND', 'Laboratorio de Ingeniería Industrial', 0, 'laboratorio'
FROM buildings WHERE code = 'LAB-IND'
  AND NOT EXISTS (
    SELECT 1 FROM classrooms c
    WHERE c.building_id = buildings.id AND c.code = 'LAB-ING-IND' AND c.deleted_at IS NULL
  );

INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), id, 'AUD-LIC', 'Audiovisual de Licenciatura', 0, 'otro'
FROM buildings WHERE code = 'AUD-LIC'
  AND NOT EXISTS (
    SELECT 1 FROM classrooms c
    WHERE c.building_id = buildings.id AND c.code = 'AUD-LIC' AND c.deleted_at IS NULL
  );

INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), id, 'AUD-ING', 'Audiovisual de Ingeniería', 0, 'otro'
FROM buildings WHERE code = 'AUD-ING'
  AND NOT EXISTS (
    SELECT 1 FROM classrooms c
    WHERE c.building_id = buildings.id AND c.code = 'AUD-ING' AND c.deleted_at IS NULL
  );

INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), id, 'LAB-FQ', 'Laboratorio de Físico Química', 0, 'laboratorio'
FROM buildings WHERE code = 'FQ'
  AND NOT EXISTS (
    SELECT 1 FROM classrooms c
    WHERE c.building_id = buildings.id AND c.code = 'LAB-FQ' AND c.deleted_at IS NULL
  );

INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), id, 'CENTRO-COMPUTO', 'Centro de Cómputo', 0, 'otro'
FROM buildings WHERE code = 'CC'
  AND NOT EXISTS (
    SELECT 1 FROM classrooms c
    WHERE c.building_id = buildings.id AND c.code = 'CENTRO-COMPUTO' AND c.deleted_at IS NULL
  );
