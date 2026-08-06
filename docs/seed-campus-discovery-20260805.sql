-- Catálogo inicial para descubrimiento del campus.
-- Los servicios no se vinculan a un área o edificio sin confirmación formal.
BEGIN;

INSERT INTO procedures
  (id, name, slug, description, kind, department_id, validation_status, is_active)
VALUES
  ('81000000-0000-4000-8000-000000000001','Inscripción','inscripcion',NULL,'servicio',NULL,'pending_validation',TRUE),
  ('81000000-0000-4000-8000-000000000002','Reinscripción','reinscripcion',NULL,'servicio',NULL,'pending_validation',TRUE),
  ('81000000-0000-4000-8000-000000000003','Expedición de constancia de estudios','expedicion-constancia-estudios',NULL,'servicio',NULL,'pending_validation',TRUE),
  ('81000000-0000-4000-8000-000000000004','Constancia de terminación de servicio social','constancia-terminacion-servicio-social',NULL,'servicio',NULL,'pending_validation',TRUE),
  ('81000000-0000-4000-8000-000000000005','Constancia de terminación de inglés','constancia-terminacion-ingles',NULL,'servicio',NULL,'pending_validation',TRUE),
  ('81000000-0000-4000-8000-000000000006','Constancia de actividades complementarias','constancia-actividades-complementarias',NULL,'servicio',NULL,'pending_validation',TRUE),
  ('81000000-0000-4000-8000-000000000007','Servicio social','servicio-social',NULL,'servicio',NULL,'pending_validation',TRUE),
  ('81000000-0000-4000-8000-000000000008','Residencia profesional','residencia-profesional',NULL,'servicio',NULL,'pending_validation',TRUE),
  ('81000000-0000-4000-8000-000000000009','Titulación','titulacion',NULL,'servicio',NULL,'pending_validation',TRUE),
  ('81000000-0000-4000-8000-000000000010','Certificado de estudios','certificado-estudios',NULL,'servicio',NULL,'pending_validation',TRUE),
  ('81000000-0000-4000-8000-000000000011','Baja temporal','baja-temporal',NULL,'servicio',NULL,'pending_validation',TRUE),
  ('81000000-0000-4000-8000-000000000012','Baja definitiva','baja-definitiva',NULL,'servicio',NULL,'pending_validation',TRUE),
  ('81000000-0000-4000-8000-000000000013','Entrega de documentación','entrega-documentacion',NULL,'servicio',NULL,'pending_validation',TRUE),
  ('81000000-0000-4000-8000-000000000014','Credencial estudiantil','credencial-estudiantil',NULL,'servicio',NULL,'pending_validation',TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Único cargo cuya relación puede sustentarse con el edificio DIR existente.
-- El nombre de la persona, oficina y horario se dejan intencionalmente NULL.
INSERT INTO institutional_positions
  (id, title, person_name, department_id, building_id, office_name,
   search_keywords, is_public, is_active)
VALUES
  ('82000000-0000-4000-8000-000000000001',
   'Director del Instituto Tecnológico de Oaxaca', NULL, NULL,
   (SELECT id FROM buildings WHERE code = 'DIR' AND deleted_at IS NULL AND is_active = TRUE LIMIT 1),
   NULL, ARRAY['director','dirección','responsable del instituto'], TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Posiciones locales calculadas con los tres puntos de calibración vigentes.
-- Los nombres de las vías se verificaron con la dirección institucional y
-- OpenStreetMap; no representan nombres inventados de calles internas.
INSERT INTO campus_streets
  (id, name, description, x, y, z, rotation, display_order, is_visible, is_active)
VALUES
  ('83000000-0000-4000-8000-000000000001','Avenida Ing. Víctor Bravo Ahuja',
   'Acceso y referencia vial del Instituto Tecnológico de Oaxaca.',-40.088,2,-122.187,0,100,TRUE,TRUE),
  ('83000000-0000-4000-8000-000000000002','Calzada Francisco I. Madero',
   'Vía cercana al límite sur-oriente del campus.',-92.184,2,126.933,0,90,TRUE,TRUE),
  ('83000000-0000-4000-8000-000000000003','Riveras del Atoyac',
   'Vía cercana al límite poniente del campus.',-132.701,2,-84.564,0,80,TRUE,TRUE),
  ('83000000-0000-4000-8000-000000000004','Avenida Constituyentes',
   'Vía cercana al límite norte del campus.',78.033,2,-151.167,0,70,TRUE,TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO quick_queries (id,label,query,category,icon,priority,is_active) VALUES
  ('84000000-0000-4000-8000-000000000001','¿Dónde puedo inscribirme?','quiero inscribirme','service','clipboard',120,TRUE),
  ('84000000-0000-4000-8000-000000000002','¿Dónde solicito una constancia?','constancia de estudios','service','document',115,TRUE),
  ('84000000-0000-4000-8000-000000000003','¿Dónde está el director?','donde encuentro al director','position','user',110,TRUE),
  ('84000000-0000-4000-8000-000000000004','¿Dónde está Servicios Escolares?','servicios escolares','department','info',105,TRUE),
  ('84000000-0000-4000-8000-000000000005','¿Dónde está el Departamento de Sistemas?','departamento de sistemas','department','computer',100,TRUE),
  ('84000000-0000-4000-8000-000000000006','¿Dónde realizo el servicio social?','servicio social','service','users',95,TRUE),
  ('84000000-0000-4000-8000-000000000007','¿Dónde tramito actividades complementarias?','actividades complementarias','service','check',90,TRUE),
  ('84000000-0000-4000-8000-000000000008','¿Dónde solicito una constancia de inglés?','constancia de terminacion de ingles','service','document',85,TRUE),
  ('84000000-0000-4000-8000-000000000009','¿Dónde están las aulas?','aulas','classroom','school',80,TRUE),
  ('84000000-0000-4000-8000-000000000010','¿Dónde puedo pedir información?','centro de informacion','building','info',75,TRUE),
  ('84000000-0000-4000-8000-000000000011','¿Dónde está la biblioteca?','biblioteca','building','book',70,TRUE),
  ('84000000-0000-4000-8000-000000000012','¿Dónde está el Centro de Cómputo?','centro de computo','building','computer',65,TRUE)
ON CONFLICT (id) DO NOTHING;

-- Alias de consultas naturales. Se ligan a la fila que exista por slug, sin
-- sustituir datos institucionales previamente capturados.
INSERT INTO search_aliases (id,entity_type,entity_id,alias)
SELECT gen_random_uuid(),'procedure',p.id,a.alias
FROM (VALUES
  ('inscripcion','inscripcion de estudiantes'),('inscripcion','quiero inscribirme'),
  ('reinscripcion','reinscripcion de estudiantes'),
  ('expedicion-constancia-estudios','constancia de estudios'),
  ('constancia-terminacion-servicio-social','constancia de servicio social'),
  ('constancia-terminacion-ingles','constancia de ingles'),
  ('constancia-terminacion-ingles','terminacion de ingles'),
  ('constancia-actividades-complementarias','actividades complementarias'),
  ('certificado-estudios','solicitud de certificado'),
  ('credencial-estudiantil','credencial de estudiante')
) AS a(slug,alias)
JOIN procedures p ON p.slug = a.slug AND p.deleted_at IS NULL
ON CONFLICT (entity_type,entity_id,alias) DO NOTHING;

INSERT INTO search_aliases (id,entity_type,entity_id,alias) VALUES
  (gen_random_uuid(),'position','82000000-0000-4000-8000-000000000001','director'),
  (gen_random_uuid(),'position','82000000-0000-4000-8000-000000000001','director del tecnológico'),
  (gen_random_uuid(),'street','83000000-0000-4000-8000-000000000001','avenida tecnológico'),
  (gen_random_uuid(),'street','83000000-0000-4000-8000-000000000001','tecnológico')
ON CONFLICT (entity_type,entity_id,alias) DO NOTHING;

INSERT INTO search_aliases (id,entity_type,entity_id,alias)
SELECT gen_random_uuid(),'building',b.id,a.alias
FROM (VALUES
  ('DIR','dirección general'),('DIR','edificio de dirección'),
  ('SERV-ESC','servicios escolares'),('SERV-ESC','control escolar'),
  ('BIB','biblioteca'),('CC','centro de cómputo')
) AS a(code,alias)
JOIN buildings b ON b.code = a.code AND b.deleted_at IS NULL
ON CONFLICT (entity_type,entity_id,alias) DO NOTHING;

COMMIT;
