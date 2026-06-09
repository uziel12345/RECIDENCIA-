-- Agrega los edificios visibles del croquis y crea nodos de entrada pendientes.
-- Los edificios sin coordenadas quedan con entrada en (0,0), no caminable y no accesible
-- para que aparezcan en el editor sin afectar el calculo de rutas.

CREATE TEMPORARY TABLE tmp_croquis_buildings (
  num INT NOT NULL,
  code VARCHAR(16) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  category_code VARCHAR(32) NOT NULL,
  PRIMARY KEY (code)
);

INSERT INTO tmp_croquis_buildings (num, code, name, slug, category_code) VALUES
(1, 'ASE', 'Asesorias', 'asesorias', 'administrativo'),
(2, 'DQI-DII', 'Dpto. de Ing. Quimica - Dpto. Ing. Industrial', 'depto-ing-quimica-industrial', 'administrativo'),
(3, 'N', 'Aula N', 'aula-n', 'aulas'),
(4, 'LAB-SIM', 'Lab. de Simulacion', 'lab-simulacion', 'laboratorio'),
(5, 'CAL', 'Caldera', 'caldera', 'servicio'),
(6, 'CC', 'Centro de Computo', 'centro-computo', 'laboratorio'),
(7, 'AUL-DOC', 'Aulas de Doctorado', 'aulas-doctorado', 'aulas'),
(8, 'DEPI', 'D.E.P.I.', 'depi', 'administrativo'),
(9, 'LAB-ELE', 'Lab. Ing. Electrica', 'lab-ing-electrica', 'laboratorio'),
(10, 'CONACYT', 'CONACYT', 'conacyt', 'administrativo'),
(11, 'MAE-CON', 'Maestria en Construccion', 'maestria-construccion', 'administrativo'),
(12, 'DIE', 'Dpto. de Ing. Electronica', 'depto-ing-electronica', 'administrativo'),
(13, 'MAE-DOC', 'Maestria en Docencia', 'maestria-docencia', 'administrativo'),
(14, 'LAB-MEC', 'Dpto. Lab. Ing. Mecanica', 'depto-lab-ing-mecanica', 'laboratorio'),
(15, 'LAB-QP', 'Lab. Quimica Pesada', 'lab-quimica-pesada', 'laboratorio'),
(16, 'LAB-CIV', 'Lab. Ing. Civil', 'lab-ing-civil', 'laboratorio'),
(17, 'CTIER', 'Dpto. Ciencias de la Tierra', 'depto-ciencias-tierra', 'administrativo'),
(18, 'AUL-AC', 'Aulas AC', 'aulas-ac', 'aulas'),
(19, 'DEL', 'Dpto. Ing. Electronica', 'depto-electronica', 'administrativo'),
(20, 'LUD', 'Ludoteca Seccion 61', 'ludoteca-seccion-61', 'servicio'),
(21, 'A', 'Edif. A', 'edif-a', 'aulas'),
(22, 'LAB-MICR', 'Lab. Micr. - Titulacion - Aula Dibujo - Banos', 'lab-micr-titulacion-aula-dibujo-banos', 'laboratorio'),
(23, 'B', 'Edif. B', 'edif-b', 'aulas'),
(24, 'FQ', 'Lab. de Fisico Quimica', 'lab-fisico-quimica', 'laboratorio'),
(25, 'MC', 'Edificio Multicarrera', 'edificio-multicarrera', 'aulas'),
(26, 'O', 'Aula O', 'aula-o', 'aulas'),
(28, 'AUD-ING', 'Audiovisual de Ing. - Banos', 'audiovisual-ing-banos', 'servicio'),
(29, 'C', 'Edif. C', 'edif-c', 'aulas'),
(30, 'DA', 'Desarrollo Academico', 'desarrollo-academico', 'administrativo'),
(31, 'CUB-MAE', 'Cubiculo de Maestros', 'cubiculo-maestros', 'administrativo'),
(32, 'BIB', 'Centro de Informacion (Biblioteca)', 'centro-informacion-biblioteca', 'biblioteca'),
(33, 'GIM', 'Gimnasio', 'gimnasio', 'servicio'),
(34, 'EXTRA', 'Extraescolares', 'extraescolares', 'servicio'),
(35, 'SERV-ESC', 'Serv. Escolares - Div. Est. Prof.', 'serv-escolares-div-est-prof', 'administrativo'),
(36, 'DIR', 'Direccion', 'direccion', 'administrativo'),
(37, 'CAF', 'Cafeteria', 'cafeteria', 'servicio'),
(38, 'COPIAS', 'Copias', 'copias', 'servicio'),
(39, 'D', 'Edif. D', 'edif-d', 'aulas'),
(40, 'PTR', 'Planta de Tratam. de Aguas Resid.', 'planta-tratamiento-aguas-residuales', 'servicio'),
(41, 'CB', 'Ciencias Basicas - Banos', 'ciencias-basicas-banos', 'aulas'),
(42, 'E', 'Edif. E', 'edif-e', 'aulas'),
(43, 'LAB-IND', 'Lab. Ing. Industrial', 'lab-ing-industrial', 'laboratorio'),
(44, 'H', 'Edif. H', 'edif-h', 'aulas'),
(45, 'F', 'Edif. F', 'edif-f', 'aulas'),
(46, 'AUD-LIC', 'Audiovisual de Licenciatura', 'audiovisual-licenciatura', 'servicio'),
(47, 'G', 'Edif. G', 'edif-g', 'aulas'),
(48, 'K', 'Edif. K - Banos', 'edif-k-banos', 'aulas'),
(49, 'AUL-S', 'Edif. S', 'edif-s', 'aulas'),
(50, 'CEA', 'Dpto. Ciencias Econ. - Admvas.', 'depto-ciencias-economico-administrativas', 'administrativo'),
(51, 'MAE-ADM', 'M. Administracion', 'maestria-administracion', 'administrativo'),
(52, 'SAL-MAE', 'Titulacion de M. en Admon.', 'titulacion-maestria-administracion', 'administrativo'),
(53, 'I', 'Edif. I', 'edif-i', 'aulas');

INSERT INTO buildings (
  id, category_id, code, name, slug, description, model_node_name,
  x, y, z, is_active, is_priority
)
SELECT
  UUID(),
  bc.id,
  t.code,
  t.name,
  t.slug,
  CONCAT('Edificio ', t.num, ' del croquis institucional. Pendiente de ubicar en el mapa.'),
  t.slug,
  NULL,
  0,
  NULL,
  1,
  0
FROM tmp_croquis_buildings t
INNER JOIN building_categories bc ON bc.code = t.category_code
LEFT JOIN buildings b ON b.code = t.code
WHERE b.id IS NULL;

INSERT INTO navigation_nodes (
  id, code, name, node_type, x, y, z, floor_level,
  is_walkable, is_active, metadata
)
SELECT
  UUID(),
  CONCAT('n-acceso-', b.slug),
  CONCAT('Acceso ', b.name),
  'entrance',
  COALESCE(b.x, 0),
  COALESCE(b.y, 0),
  COALESCE(b.z, 0),
  0,
  CASE WHEN b.x IS NULL OR b.z IS NULL THEN 0 ELSE 1 END,
  1,
  JSON_OBJECT(
    'source', 'croquis-20260609',
    'building_code', b.code,
    'croquis_number', t.num,
    'pending_position', CASE WHEN b.x IS NULL OR b.z IS NULL THEN TRUE ELSE FALSE END
  )
FROM tmp_croquis_buildings t
INNER JOIN buildings b ON b.code = t.code
LEFT JOIN navigation_nodes n ON n.code = CONCAT('n-acceso-', b.slug)
WHERE n.id IS NULL;

INSERT INTO building_entrances (
  id, building_id, node_id, entrance_name, entrance_type,
  is_primary, is_accessible
)
SELECT
  UUID(),
  b.id,
  n.id,
  CONCAT('Acceso principal - ', b.name),
  'main',
  1,
  n.is_walkable
FROM tmp_croquis_buildings t
INNER JOIN buildings b ON b.code = t.code
INNER JOIN navigation_nodes n ON n.code = CONCAT('n-acceso-', b.slug)
LEFT JOIN building_entrances be ON be.building_id = b.id AND be.node_id = n.id
WHERE be.id IS NULL;

DROP TEMPORARY TABLE tmp_croquis_buildings;
