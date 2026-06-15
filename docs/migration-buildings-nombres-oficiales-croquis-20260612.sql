-- Nombres oficiales de edificios segun la lista del croquis compartida.
-- Aplica cambios en buildings para que admin, busqueda y etiquetas usen el mismo nombre.

START TRANSACTION;

CREATE TEMPORARY TABLE tmp_official_buildings (
  num_label VARCHAR(8) NOT NULL,
  code VARCHAR(16) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  category_code VARCHAR(32) NOT NULL,
  PRIMARY KEY (code)
);

INSERT INTO tmp_official_buildings (num_label, code, name, slug, category_code) VALUES
('1', 'ASE', 'ASESORÍAS', 'asesorias', 'administrativo'),
('2', 'DQI-DII', 'DPTO. DE ING. QUÍMICA - DPTO. ING. INDUSTRIAL', 'depto-ing-quimica-industrial', 'administrativo'),
('3', 'N', 'AULA Ñ', 'aula-n', 'aulas'),
('4', 'LAB-SIM', 'LAB. DE SIMULACIÓN', 'lab-simulacion', 'laboratorio'),
('5', 'CAL', 'CALDERA', 'caldera', 'servicio'),
('6', 'CC', 'CENTRO DE CÓMPUTO', 'centro-computo', 'laboratorio'),
('7', 'AUL-DOC', 'AULAS DE DOCTORADO', 'aulas-doctorado', 'aulas'),
('8', 'DEPI', 'D.E.P.I.', 'depi', 'administrativo'),
('9', 'LAB-ELE', 'LAB. ING. ELÉCTRICA', 'lab-ing-electrica', 'laboratorio'),
('10', 'CONACYT', 'CONACYT', 'conacyt', 'administrativo'),
('11', 'MAE-CON', 'MAESTRÍA EN CONSTRUCCIÓN', 'maestria-construccion', 'administrativo'),
('12', 'DIE', 'DPTO. DE ING. ELECTRÓNICA', 'depto-ing-electronica', 'administrativo'),
('13', 'MAE-DOC', 'MAESTRÍA EN DOCENCIA', 'maestria-docencia', 'administrativo'),
('14', 'LAB-MEC', 'DPTO. LAB. ING. MECÁNICA', 'depto-lab-ing-mecanica', 'laboratorio'),
('15', 'LAB-QP', 'LAB. QUÍMICA PESADA', 'lab-quimica-pesada', 'laboratorio'),
('16', 'LAB-CIV', 'LAB. ING. CIVIL', 'lab-ing-civil', 'laboratorio'),
('17', 'CTIER', 'DPTO. CIENCIAS DE LA TIERRA', 'depto-ciencias-tierra', 'administrativo'),
('18', 'AUL-AC', 'AULAS AC', 'aulas-ac', 'aulas'),
('19', 'DEL', 'DPTO. ING. ELECTRÓNICA', 'depto-electronica', 'administrativo'),
('20', 'LUD', 'LUDOTECA SECCIÓN 61', 'ludoteca-seccion-61', 'servicio'),
('21', 'A', 'EDIF. A', 'edif-a', 'aulas'),
('22', 'LAB-MICR', 'LAB. MICR.- TITULACIÓN - AULA DIBUJO - BAÑOS', 'lab-micr-titulacion-aula-dibujo-banos', 'laboratorio'),
('23', 'B', 'EDIF. B', 'edif-b', 'aulas'),
('24', 'FQ', 'LAB. DE FÍSICO QUÍMICA', 'lab-fisico-quimica', 'laboratorio'),
('25', 'MC', 'EDIFICIO MULTICARRERA', 'edificio-multicarrera', 'aulas'),
('26', 'O', 'AULA O', 'aula-o', 'aulas'),
('27', 'AUL-P', 'AULAS P', 'aulas-p', 'aulas'),
('28', 'AUD-ING', 'AUDIOVISUAL DE ING.- BAÑOS', 'audiovisual-ing-banos', 'servicio'),
('29', 'C', 'EDIF. C', 'edif-c', 'aulas'),
('30', 'DA', 'DESARROLLO ACADÉMICO', 'desarrollo-academico', 'administrativo'),
('31', 'CUB-MAE', 'CUBÍCULO DE MAESTROS', 'cubiculo-maestros', 'administrativo'),
('32', 'BIB', 'CENTRO DE INFORMACIÓN (BIBLIOTECA)', 'centro-informacion-biblioteca', 'biblioteca'),
('33', 'GIM', 'GIMNASIO', 'gimnasio', 'servicio'),
('34', 'EXTRA', 'EXTRAESCOLARES', 'extraescolares', 'servicio'),
('35', 'SERV-ESC', 'SERV. ESCOLARES - DIV. EST. PROF.', 'serv-escolares-div-est-prof', 'administrativo'),
('36', 'DIR', 'DIRECCIÓN', 'direccion', 'administrativo'),
('37', 'CAF', 'CAFETERÍA', 'cafeteria', 'servicio'),
('38', 'COPIAS', 'COPIAS', 'copias', 'servicio'),
('39', 'D', 'EDIF. D', 'edif-d', 'aulas'),
('40', 'PTR', 'PLANTA DE TRATAM. DE AGUAS RESID.', 'planta-tratamiento-aguas-residuales', 'servicio'),
('41', 'CB', 'CIENCIAS BÁSICAS - BAÑOS', 'ciencias-basicas-banos', 'aulas'),
('42', 'E', 'EDIF. E', 'edif-e', 'aulas'),
('43', 'LAB-IND', 'LAB. ING. INDUSTRIAL', 'lab-ing-industrial', 'laboratorio'),
('44', 'H', 'EDIF. H', 'edif-h', 'aulas'),
('45', 'F', 'EDIF. F', 'edif-f', 'aulas'),
('46', 'AUD-LIC', 'AUDIOVISUAL DE LICENCIATURA', 'audiovisual-licenciatura', 'servicio'),
('47', 'G', 'EDIF. G', 'edif-g', 'aulas'),
('48', 'K', 'EDIF. K - BAÑOS', 'edif-k-banos', 'aulas'),
('49', 'AUL-S', 'EDIF. S', 'edif-s', 'aulas'),
('50', 'CEA', 'DPTO. CIENCIAS ECON.- ADMVAS.', 'depto-ciencias-economico-administrativas', 'administrativo'),
('51', 'MAE-ADM', 'M. ADMINISTRACIÓN', 'maestria-administracion', 'administrativo'),
('52', 'SAL-MAE', 'TITULACIÓN DE M. EN ADMÓN.,', 'titulacion-maestria-administracion', 'administrativo'),
('53', 'I', 'EDIF. I', 'edif-i', 'aulas'),
('VIG', 'VIG', 'CASETA DE VIGILANCIA', 'caseta-vigilancia', 'servicio');

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
  CONCAT('Edificio ', t.num_label, ' del croquis institucional. Pendiente de ubicar con coordenadas exactas.'),
  t.slug,
  NULL,
  0,
  NULL,
  1,
  0
FROM tmp_official_buildings t
INNER JOIN building_categories bc ON bc.code = t.category_code
LEFT JOIN buildings b ON b.code = t.code
WHERE b.id IS NULL;

UPDATE buildings b
INNER JOIN tmp_official_buildings t ON t.code = b.code
INNER JOIN building_categories bc ON bc.code = t.category_code
SET
  b.name = t.name,
  b.slug = t.slug,
  b.category_id = bc.id,
  b.description = COALESCE(
    NULLIF(b.description, ''),
    CONCAT('Edificio ', t.num_label, ' del croquis institucional.')
  ),
  b.is_active = 1,
  b.deleted_at = NULL;

UPDATE navigation_nodes n
INNER JOIN buildings b ON n.code = CONCAT('n-acceso-', b.slug)
INNER JOIN tmp_official_buildings t ON t.code = b.code
SET n.name = CONCAT('Acceso ', t.name);

DROP TEMPORARY TABLE tmp_official_buildings;

COMMIT;
