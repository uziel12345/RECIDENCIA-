-- ============================================================
-- Detalle de contenido por edificio (aulas, laboratorios, jefaturas,
-- departamentos, cubículos numerados, espacios varios) según el
-- documento "EDIFICIOS: AULAS – SERVICIOS QUE OFRECEN – DEPARTAMENTOS"
-- compartido por el usuario (26 edificios).
-- Fecha: 2026-07-13
--
-- Idempotente: cada INSERT usa WHERE NOT EXISTS / clave única existente,
-- se puede re-ejecutar sin duplicar filas.
--
-- Omitido a propósito:
--   - "Baños" (mencionado en casi todos los edificios): no es un
--     espacio identificable/localizable, no se modela como fila.
--   - Edificio 15 "Edificio M" (Aulas M1–M7): no existe como building
--     en la BD. El GLB sí tiene un nodo "Aula_M" pero crear el building
--     requiere posicionar/calibrar coordenadas reales (fuera de alcance
--     de esta carga de datos) — pendiente de que el usuario lo agregue
--     vía el calibrador de geolocalización del admin.
--   - Contenido redundante con el propio nombre del edificio (p.ej.
--     "Audiovisual de licenciatura" dentro del edificio Audiovisual de
--     Licenciatura) no se repite como fila hija.
--
-- Aplica con:
--   mysql -u <usuario> -p mapa_ito < docs/migration-edificios-detalle-croquis-20260713.sql
-- ============================================================

-- ── 1. Edificio B (code B) ──────────────────────────────────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, x.floor, 'aula'
FROM buildings b
JOIN (
  SELECT 'B1' code, 'B1' name, 0 floor UNION ALL SELECT 'B2','B2',0 UNION ALL SELECT 'B3','B3',0
  UNION ALL SELECT 'B4','B4',0 UNION ALL SELECT 'B5','B5',0
  UNION ALL SELECT 'B6','B6',1 UNION ALL SELECT 'B7','B7',1 UNION ALL SELECT 'B8','B8',1 UNION ALL SELECT 'B9','B9',1
) x ON 1=1
WHERE b.code = 'B'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

-- ── 2. Edificio C (code C) ──────────────────────────────────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, x.floor, 'aula'
FROM buildings b
JOIN (
  SELECT 'C1' code, 'C1' name, 0 floor UNION ALL SELECT 'C2','C2',0 UNION ALL SELECT 'C3','C3',0
  UNION ALL SELECT 'C4','C4',0 UNION ALL SELECT 'C5','C5',0
  UNION ALL SELECT 'C6','C6',1 UNION ALL SELECT 'C7','C7',1 UNION ALL SELECT 'C8','C8',1 UNION ALL SELECT 'C9','C9',1
) x ON 1=1
WHERE b.code = 'C'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

-- ── 3. Edificio I (code I) ──────────────────────────────────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, x.floor, 'aula'
FROM buildings b
JOIN (
  SELECT 'I1' code, 'I1' name, 0 floor UNION ALL SELECT 'I2','I2',0 UNION ALL SELECT 'I3','I3',0
  UNION ALL SELECT 'I4','I4',0 UNION ALL SELECT 'I5','I5',0 UNION ALL SELECT 'I6','I6',0
  UNION ALL SELECT 'I7','I7',0 UNION ALL SELECT 'I8','I8',0 UNION ALL SELECT 'I9','I9',0
  UNION ALL SELECT 'I10','I10',1 UNION ALL SELECT 'I11','I11',1 UNION ALL SELECT 'I12','I12',1
  UNION ALL SELECT 'I13','I13',1 UNION ALL SELECT 'I14','I14',1
) x ON 1=1
WHERE b.code = 'I'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, 'CUB-MAE', 'Cubículos de Maestros', 1, 'otro'
FROM buildings b WHERE b.code = 'I'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = 'CUB-MAE');

INSERT INTO departments (id, building_id, name)
SELECT UUID(), b.id, x.name
FROM buildings b
JOIN (SELECT 'Departamento de Sistemas y Computación' name UNION ALL SELECT 'Departamento de Vinculación') x ON 1=1
WHERE b.code = 'I'
  AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.building_id = b.id AND d.name = x.name);

-- ── 4. Sala de Titulación de la Maestría en ADMON (code SAL-MAE) ─
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, 0, 'aula'
FROM buildings b
JOIN (SELECT 'Q8' code, 'Q8' name UNION ALL SELECT 'Q9','Q9' UNION ALL SELECT 'Q10','Q10') x ON 1=1
WHERE b.code = 'SAL-MAE'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

-- ── 5. Depto. de Ciencias Económico-Administrativas (code CEA) ─
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, 'J1', 'J1', 0, 'aula'
FROM buildings b WHERE b.code = 'CEA'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = 'J1');

-- ── 6. Edificio S (code AUL-S; el code "S" es un duplicado inactivo) ─
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, 0, 'aula'
FROM buildings b
JOIN (SELECT 'S1' code,'S1' name UNION ALL SELECT 'S2','S2' UNION ALL SELECT 'S3','S3' UNION ALL SELECT 'S4','S4') x ON 1=1
WHERE b.code = 'AUL-S'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

-- ── 7. Edificio K (code K) ──────────────────────────────────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, 0, x.type
FROM buildings b
JOIN (
  SELECT 'BA' code, 'Aula BA' name, 'aula' type
  UNION ALL SELECT 'K1', 'Aula K1', 'aula'
  UNION ALL SELECT 'LAB-FIS', 'Laboratorio de Física (Depto. de Ciencias Básicas)', 'laboratorio'
) x ON 1=1
WHERE b.code = 'K'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

-- ── 8. Edificio G (code G) ──────────────────────────────────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, 0, 'aula'
FROM buildings b
JOIN (SELECT 'G1' code,'G1' name UNION ALL SELECT 'G2','G2' UNION ALL SELECT 'G3','G3' UNION ALL SELECT 'G4','G4') x ON 1=1
WHERE b.code = 'G'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

-- ── 9. Edificio F (code F) ──────────────────────────────────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, x.floor, 'aula'
FROM buildings b
JOIN (
  SELECT 'F1' code,'F1' name,0 floor UNION ALL SELECT 'F2','F2',0 UNION ALL SELECT 'F3','F3',0 UNION ALL SELECT 'F4','F4',0
  UNION ALL SELECT 'F5','F5',1 UNION ALL SELECT 'F6','F6',1 UNION ALL SELECT 'F7','F7',1 UNION ALL SELECT 'F8','F8',1
) x ON 1=1
WHERE b.code = 'F'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, 'SALA-JUNTAS', 'Sala de Juntas — Academia de Ciencias Básicas', 0, 'otro'
FROM buildings b WHERE b.code = 'F'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = 'SALA-JUNTAS');

-- ── 10. Audiovisual de Licenciatura (code AUD-LIC) ──────────
INSERT INTO departments (id, building_id, name)
SELECT UUID(), b.id, 'Delegación Sindical D-II'
FROM buildings b WHERE b.code = 'AUD-LIC'
  AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.building_id = b.id AND d.name = 'Delegación Sindical D-II');

-- ── 11. Edificio H (code H) ─────────────────────────────────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, 0, x.type
FROM buildings b
JOIN (
  SELECT 'H1' code,'H1' name,'aula' type UNION ALL SELECT 'H2','H2','aula'
  UNION ALL SELECT 'COVID', 'Reconversión Covid-19', 'otro'
  UNION ALL SELECT 'SERV-MED', 'Servicio Médico', 'otro'
) x ON 1=1
WHERE b.code = 'H'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

INSERT INTO departments (id, building_id, name)
SELECT UUID(), b.id, 'Coordinación de Lenguas Extranjeras'
FROM buildings b WHERE b.code = 'H'
  AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.building_id = b.id AND d.name = 'Coordinación de Lenguas Extranjeras');

-- ── 12. Edificio E (code E) ─────────────────────────────────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, x.floor, 'aula'
FROM buildings b
JOIN (
  SELECT 'E1' code,'E1' name,0 floor UNION ALL SELECT 'E2','E2',0 UNION ALL SELECT 'E3','E3',0 UNION ALL SELECT 'E4','E4',0
  UNION ALL SELECT 'E5','E5',1 UNION ALL SELECT 'E6','E6',1 UNION ALL SELECT 'E7','E7',1 UNION ALL SELECT 'E8','E8',1
) x ON 1=1
WHERE b.code = 'E'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

-- ── 13. Laboratorio de Ing. Industrial (code LAB-IND) ───────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, 'ALMACEN', 'Almacén', 0, 'otro'
FROM buildings b WHERE b.code = 'LAB-IND'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = 'ALMACEN');

-- ── 14. Edificio Q (code Q) ──────────────────────────────────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, x.floor, x.type
FROM buildings b
JOIN (
  SELECT 'LAB-ALIM' code,'Laboratorio de Tecnología de Alimentos' name,0 floor,'laboratorio' type
  UNION ALL SELECT 'BODEGA','Bodega',0,'otro'
  UNION ALL SELECT 'SALA-JUNTAS','Sala de Juntas',0,'otro'
  UNION ALL SELECT 'Q5','Q5',0,'aula'
  UNION ALL SELECT 'LAB-QP','Laboratorio de Química Pesada',0,'laboratorio'
  UNION ALL SELECT 'LAB-ANALISIS','Laboratorio de Análisis Instrumental',1,'laboratorio'
  UNION ALL SELECT 'Q6','Q6',1,'aula'
  UNION ALL SELECT 'Q7','Q7',1,'aula'
  UNION ALL SELECT 'LAB-SIMPROC','Laboratorio de Simulación de Procesos',1,'laboratorio'
  UNION ALL SELECT 'SITE','SITE (Cuarto de Servidores)',1,'otro'
) x ON 1=1
WHERE b.code = 'Q'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

INSERT INTO headquarters (id, building_id, name)
SELECT UUID(), b.id, x.name
FROM buildings b
JOIN (
  SELECT 'Jefatura de Laboratorio (Planta Baja)' name
  UNION ALL SELECT 'Jefatura de Laboratorio (Planta Alta)'
) x ON 1=1
WHERE b.code = 'Q'
  AND NOT EXISTS (SELECT 1 FROM headquarters h WHERE h.building_id = b.id AND h.name = x.name);

INSERT INTO teacher_cubicles (id, building_id, code)
SELECT UUID(), b.id, x.code
FROM buildings b
JOIN (SELECT '1' code UNION ALL SELECT '2') x ON 1=1
WHERE b.code = 'Q'
  AND NOT EXISTS (SELECT 1 FROM teacher_cubicles t WHERE t.building_id = b.id AND t.code = x.code);

-- ── 15. Edificio M — OMITIDO: building inexistente, ver cabecera ─

-- ── 16. Edificio L (code L) ─────────────────────────────────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, x.floor, 'aula'
FROM buildings b
JOIN (
  SELECT 'L1' code,'L1' name,0 floor UNION ALL SELECT 'L2','L2',0 UNION ALL SELECT 'L3','L3',0
  UNION ALL SELECT 'L4','L4',0 UNION ALL SELECT 'L5','L5',0
  UNION ALL SELECT 'L6','L6',1 UNION ALL SELECT 'L7','L7',1 UNION ALL SELECT 'L8','L8',1
  UNION ALL SELECT 'L9','L9',1 UNION ALL SELECT 'L10','L10',1
) x ON 1=1
WHERE b.code = 'L'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

INSERT INTO headquarters (id, building_id, name)
SELECT UUID(), b.id, 'Jefatura — Departamento de Metal Mecánica'
FROM buildings b WHERE b.code = 'L'
  AND NOT EXISTS (SELECT 1 FROM headquarters h WHERE h.building_id = b.id AND h.name = 'Jefatura — Departamento de Metal Mecánica');

INSERT INTO departments (id, building_id, name)
SELECT UUID(), b.id, 'Departamento de Ciencias de la Tierra'
FROM buildings b WHERE b.code = 'L'
  AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.building_id = b.id AND d.name = 'Departamento de Ciencias de la Tierra');

-- ── 17. Laboratorio de Físico Química (code FQ) ─────────────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, 0, 'laboratorio'
FROM buildings b
JOIN (
  SELECT 'LAB-CLIN' code,'Laboratorio de Análisis Clínicos' name
  UNION ALL SELECT 'LAB-QUIM-I','Laboratorio de Química Analítica I'
  UNION ALL SELECT 'LAB-QUIM-II','Laboratorio de Química Analítica II'
) x ON 1=1
WHERE b.code = 'FQ'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

INSERT INTO headquarters (id, building_id, name)
SELECT UUID(), b.id, 'Jefatura — Laboratorio de Físico Química'
FROM buildings b WHERE b.code = 'FQ'
  AND NOT EXISTS (SELECT 1 FROM headquarters h WHERE h.building_id = b.id AND h.name = 'Jefatura — Laboratorio de Físico Química');

-- ── 18. Depto. de Desarrollo Académico (code DA) ────────────
INSERT INTO departments (id, building_id, name)
SELECT UUID(), b.id, 'Desarrollo Académico'
FROM buildings b WHERE b.code = 'DA'
  AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.building_id = b.id AND d.name = 'Desarrollo Académico');

-- ── 19. Audiovisual de Ingeniería (code AUD-ING) ────────────
INSERT INTO departments (id, building_id, name)
SELECT UUID(), b.id, 'Coordinación de Actividades Complementarias'
FROM buildings b WHERE b.code = 'AUD-ING'
  AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.building_id = b.id AND d.name = 'Coordinación de Actividades Complementarias');

-- ── 20. Edificio A (code A) ─────────────────────────────────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, x.floor, 'aula'
FROM buildings b
JOIN (
  SELECT 'A1' code,'A1' name,0 floor UNION ALL SELECT 'A2','A2',0 UNION ALL SELECT 'A3','A3',0 UNION ALL SELECT 'A4','A4',0
  UNION ALL SELECT 'A5','A5',1 UNION ALL SELECT 'A6','A6',1 UNION ALL SELECT 'A7','A7',1 UNION ALL SELECT 'A8','A8',1
) x ON 1=1
WHERE b.code = 'A'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

-- ── 21. Sección 61 (code "SECCIÓN 61") ──────────────────────
INSERT INTO departments (id, building_id, name)
SELECT UUID(), b.id, 'SNTE — Sindicato Nacional de Trabajadores de la Educación'
FROM buildings b WHERE b.code = 'SECCIÓN 61'
  AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.building_id = b.id AND d.name = 'SNTE — Sindicato Nacional de Trabajadores de la Educación');

-- ── 22. Depto. de Ing. Eléctrica (code DIE) ─────────────────
INSERT INTO departments (id, building_id, name)
SELECT UUID(), b.id, x.name
FROM buildings b
JOIN (
  SELECT 'Departamento de Mantenimiento de Equipo' name
  UNION ALL SELECT 'Desarrollo Sustentable'
  UNION ALL SELECT 'Servicios Generales'
) x ON 1=1
WHERE b.code = 'DIE'
  AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.building_id = b.id AND d.name = x.name);

-- ── 23. Aulas y Cubículos de Doctorado (code AUL-DOC) ───────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, 0, 'aula'
FROM buildings b
JOIN (SELECT '55' code,'55' name UNION ALL SELECT '56','56' UNION ALL SELECT '57','57') x ON 1=1
WHERE b.code = 'AUL-DOC'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

-- ── 24. Depto. de Química y Bioquímica (code DQB) ───────────
INSERT INTO departments (id, building_id, name)
SELECT UUID(), b.id, 'Departamento de Química y Bioquímica'
FROM buildings b WHERE b.code = 'DQB'
  AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.building_id = b.id AND d.name = 'Departamento de Química y Bioquímica');

-- ── 24b. Depto. de Ing. Industrial (code DQI-DII) ───────────
INSERT INTO departments (id, building_id, name)
SELECT UUID(), b.id, x.name
FROM buildings b
JOIN (
  SELECT 'Vinculación' name
  UNION ALL SELECT 'Residencias Profesionales'
  UNION ALL SELECT 'Centro de Patentamiento'
  UNION ALL SELECT 'Secretaría del Departamento'
) x ON 1=1
WHERE b.code = 'DQI-DII'
  AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.building_id = b.id AND d.name = x.name);

INSERT INTO headquarters (id, building_id, name)
SELECT UUID(), b.id, x.name
FROM buildings b
JOIN (
  SELECT 'Jefatura de Ingeniería Industrial' name
  UNION ALL SELECT 'Jefatura de Docencia'
  UNION ALL SELECT 'Jefatura de Investigación'
  UNION ALL SELECT 'Jefatura de Vinculación'
) x ON 1=1
WHERE b.code = 'DQI-DII'
  AND NOT EXISTS (SELECT 1 FROM headquarters h WHERE h.building_id = b.id AND h.name = x.name);

INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, 1, x.type
FROM buildings b
JOIN (
  SELECT 'C17' code,'C17' name,'aula' type UNION ALL SELECT 'C18','C18','aula'
  UNION ALL SELECT 'C19','C19','aula' UNION ALL SELECT 'C20','C20','aula'
  UNION ALL SELECT 'C21','C21','aula' UNION ALL SELECT 'C24','C24','aula'
  UNION ALL SELECT 'LAB-AMBIENTAL','Laboratorio de Control Ambiental','laboratorio'
) x ON 1=1
WHERE b.code = 'DQI-DII'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

-- ── 25. Asesorías (code ASE) ────────────────────────────────
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, 'ARCHIVO', 'Archivo de Concentración', 0, 'otro'
FROM buildings b WHERE b.code = 'ASE'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = 'ARCHIVO');

-- ── 26. Centro de Cómputo y Sistemas Computacionales (code CC) ─
INSERT INTO classrooms (id, building_id, code, name, floor, type)
SELECT UUID(), b.id, x.code, x.name, x.floor, x.type
FROM buildings b
JOIN (
  SELECT 'CREDENCIALES' code,'Credenciales' name,0 floor,'otro' type
  UNION ALL SELECT 'LAB-COMPUTO','Laboratorio de Cómputo',0,'laboratorio'
  UNION ALL SELECT 'LAB-REDES','Laboratorio de Redes',1,'laboratorio'
  UNION ALL SELECT 'LAB-REGIONAL','Laboratorio de Estudios Regionales y Urbanos',1,'laboratorio'
  UNION ALL SELECT 'OFI-INVENTARIOS','Oficina de Inventarios',1,'otro'
  UNION ALL SELECT 'LAB-BD-MATE','Laboratorios de Base de Datos y Matemáticas',1,'laboratorio'
) x ON 1=1
WHERE b.code = 'CC'
  AND NOT EXISTS (SELECT 1 FROM classrooms c WHERE c.building_id = b.id AND c.code = x.code);

INSERT INTO headquarters (id, building_id, name)
SELECT UUID(), b.id, 'Jefatura del Centro de Cómputo'
FROM buildings b WHERE b.code = 'CC'
  AND NOT EXISTS (SELECT 1 FROM headquarters h WHERE h.building_id = b.id AND h.name = 'Jefatura del Centro de Cómputo');

INSERT INTO departments (id, building_id, name)
SELECT UUID(), b.id, x.name
FROM buildings b
JOIN (
  SELECT 'Coordinación de Servicios a Internet' name
  UNION ALL SELECT 'Departamento de Recursos Materiales'
) x ON 1=1
WHERE b.code = 'CC'
  AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.building_id = b.id AND d.name = x.name);
