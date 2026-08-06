-- Coordenadas extraídas de apps/web/public/models/campus.glb.
-- Generado por: pnpm --filter web audit:model-coordinates
-- Actualiza solo registros con id + model_node_name todavía coincidentes.

BEGIN;

CREATE TEMP TABLE target_building_model_coordinates (
  id VARCHAR(36) PRIMARY KEY,
  model_node_name VARCHAR(255) NOT NULL,
  x DECIMAL(10,4) NOT NULL,
  z DECIMAL(10,4) NOT NULL
) ON COMMIT DROP;

INSERT INTO target_building_model_coordinates (id, model_node_name, x, z) VALUES
  ('7ede66d9-6436-11f1-9da2-d843ae05cb18', 'Edificio_A', -57.6729, -86.4886),
  ('75a95e64-52ec-11f1-a7fc-d843ae05cb18', 'Asesorias', 100.4604, -112.8155),
  ('7ede6894-6436-11f1-9da2-d843ae05cb18', 'Audiovisual_de_Ingeneria', -81.3508, -83.4430),
  ('a374c9d7-3f3a-11f1-b497-d843ae05cb18', 'Audiovisual_de_Lic', -62.1717, 91.2728),
  ('75a96085-52ec-11f1-a7fc-d843ae05cb18', 'Matria_Docencia_Sala_Educacion_distancia', -0.9690, -87.6481),
  ('7ede6929-6436-11f1-9da2-d843ae05cb18', 'Aula_AC', 68.4692, -42.3353),
  ('7ede697e-6436-11f1-9da2-d843ae05cb18', 'Aulas_Cubiculos_de_Doctorado', 92.0937, -68.6609),
  ('c0b580af-6687-11f1-9d41-d843ae05cb18', 'Aula_P', 95.4357, 25.1444),
  ('a374ca59-3f3a-11f1-b497-d843ae05cb18', 'Edificio_S', 1.7978, 140.1738),
  ('75a9394c-52ec-11f1-a7fc-d843ae05cb18', 'Edificio_B', -0.2882, -48.1009),
  ('ee10ec94-74b0-11f1-8da2-d843ae05cb18', 'Bodega_1', 109.8102, -10.6058),
  ('ee11c0dd-74b0-11f1-8da2-d843ae05cb18', 'Bodega_2', 105.3231, -0.4078),
  ('75a93569-52ec-11f1-a7fc-d843ae05cb18', 'Edificio_C', -16.3646, -32.9542),
  ('a374ca07-3f3a-11f1-b497-d843ae05cb18', 'Cafeteria', 7.5663, 57.9060),
  ('7ede6c61-6436-11f1-9da2-d843ae05cb18', 'Caldera', 46.4290, -92.8671),
  ('7ede6d43-6436-11f1-9da2-d843ae05cb18', 'Depto_Ciencias_Basicas', -39.9973, 65.9275),
  ('a374c93e-3f3a-11f1-b497-d843ae05cb18', 'Centro_computo_Sistemas_Computacionales', 63.2534, -81.7292),
  ('7ede6e23-6436-11f1-9da2-d843ae05cb18', 'Depto_ciencias_Economico_Admin', -57.9878, 114.8510),
  ('a374c922-3f3a-11f1-b497-d843ae05cb18', 'Centro_informacion', 20.0716, 20.5676),
  ('ee0ff11d-74b0-11f1-8da2-d843ae05cb18', 'Centro_informacion', 20.0716, 20.5676),
  ('7ede6e81-6436-11f1-9da2-d843ae05cb18', 'Edificio_Conacyt', -66.0583, -123.0124),
  ('7ede6ed0-6436-11f1-9da2-d843ae05cb18', 'Lab_Microscopia_Sala_Titulacion_Aula_Dibujo', -34.0998, -58.4886),
  ('7ede6f19-6436-11f1-9da2-d843ae05cb18', 'Depto_Ciencias_la_tierra', 44.5914, -34.4464),
  ('75a95a0a-52ec-11f1-a7fc-d843ae05cb18', 'Aulas_Cubiculos_de_Doctorado', 92.0937, -68.6609),
  ('7ede705d-6436-11f1-9da2-d843ae05cb18', 'Cubiculos_Maestros', -7.5412, 7.8105),
  ('7ede7106-6436-11f1-9da2-d843ae05cb18', 'Depto_desarrollo_academico', -69.2501, -46.8670),
  ('75a95c2e-52ec-11f1-a7fc-d843ae05cb18', 'Edif y Depto de Ing. Electronica', 88.3022, -32.9104),
  ('7ede7187-6436-11f1-9da2-d843ae05cb18', 'D.P.I', 117.0276, -45.5772),
  ('7ede71d4-6436-11f1-9da2-d843ae05cb18', 'Depto_Ing_Electrica', -23.2238, -100.9610),
  ('a374c8c9-3f3a-11f1-b497-d843ae05cb18', 'Depto_servico_escolares_Div_estudios_profecionales_Direccion', -52.0612, 0.0448),
  ('75a95801-52ec-11f1-a7fc-d843ae05cb18', 'Depto_Quimica_Bioquimica_Depto_Ing_Industrial', 106.8369, -92.3560),
  ('7ede72a6-6436-11f1-9da2-d843ae05cb18', 'Depto_Quimica_Bioquimica_Depto_Ing_Industrial', 106.8369, -92.3560),
  ('a374c992-3f3a-11f1-b497-d843ae05cb18', 'Edificio_E', -3.2243, 74.7988),
  ('75a94357-52ec-11f1-a7fc-d843ae05cb18', 'Aula_Ñ', 116.7182, -75.4928),
  ('7ede742d-6436-11f1-9da2-d843ae05cb18', 'Extra_escolares', 93.8987, 43.3742),
  ('a374c9a4-3f3a-11f1-b497-d843ae05cb18', 'Edificio_F', -17.3545, 95.7133),
  ('75a946e3-52ec-11f1-a7fc-d843ae05cb18', 'Laboratorio_Fisico_Quimica', 16.2681, -18.1562),
  ('a374c9b6-3f3a-11f1-b497-d843ae05cb18', 'Edificio_G', -31.5576, 112.3083),
  ('a374ca1b-3f3a-11f1-b497-d843ae05cb18', 'Gimnacio', 56.6284, 43.2168),
  ('a374c957-3f3a-11f1-b497-d843ae05cb18', 'Edificio_H_Servicio_Medico', -53.8696, 79.0223),
  ('a374c96b-3f3a-11f1-b497-d843ae05cb18', 'Edificio_I', -83.2140, 125.3034),
  ('a374ca70-3f3a-11f1-b497-d843ae05cb18', 'Edificio_K', -2.2033, 129.4134),
  ('75a92791-52ec-11f1-a7fc-d843ae05cb18', 'Edificio_L', 42.9656, 2.4637),
  ('75a950bd-52ec-11f1-a7fc-d843ae05cb18', 'Lab_Ing_Civil', 55.9127, -47.0509),
  ('75a94e80-52ec-11f1-a7fc-d843ae05cb18', 'Lab_Ing_Electrica', 20.0459, -109.5484),
  ('a374ca43-3f3a-11f1-b497-d843ae05cb18', 'Laboratorio_Ing_Industrial', 33.6550, 117.9370),
  ('7ede7760-6436-11f1-9da2-d843ae05cb18', 'Lab_Depto_Ing_Mecanica_Lab_Quimaca_Pesada', 26.9331, -68.1119),
  ('7ede77d3-6436-11f1-9da2-d843ae05cb18', 'Lab_Microscopia_Sala_Titulacion_Aula_Dibujo', -34.0998, -58.4886),
  ('7ede7867-6436-11f1-9da2-d843ae05cb18', 'Lab_Depto_Ing_Mecanica_Lab_Quimaca_Pesada', 26.9331, -68.1119),
  ('75a94c1b-52ec-11f1-a7fc-d843ae05cb18', 'Laboratorio_Fisico_Quimica', 16.2681, -18.1562),
  ('7ede78c3-6436-11f1-9da2-d843ae05cb18', 'Lab_Simulacion', 42.6357, -106.7305),
  ('4eb17a7e-7ef8-11f1-8a16-d0460c699407', 'Aula_M', 73.6617, 16.0164),
  ('7ede796d-6436-11f1-9da2-d843ae05cb18', 'Maestria_Administracion', -28.0887, 129.4412),
  ('7ede79c3-6436-11f1-9da2-d843ae05cb18', 'Maestria_cosntruccion', -46.2110, -123.1921),
  ('7ede7a15-6436-11f1-9da2-d843ae05cb18', 'Matria_Docencia_Sala_Educacion_distancia', -0.9690, -87.6481),
  ('7ede7aba-6436-11f1-9da2-d843ae05cb18', 'Aula_Ñ', 116.7182, -75.4928),
  ('a374c9ee-3f3a-11f1-b497-d843ae05cb18', 'Edificio_Nuevo', -84.7390, 88.1865),
  ('a374ca2e-3f3a-11f1-b497-d843ae05cb18', 'Edificio_Q', 46.6227, 83.7022),
  ('ee0e59f4-74b0-11f1-8da2-d843ae05cb18', 'Edificio_S', 1.7978, 140.1738),
  ('75a952fa-52ec-11f1-a7fc-d843ae05cb18', 'Lab_Microscopia_Sala_Titulacion_Aula_Dibujo', -34.0998, -58.4886),
  ('7ede7bfb-6436-11f1-9da2-d843ae05cb18', 'Sala_Titulacion_Maestria-Admon', -39.9488, 132.1912),
  ('7ede790e-6436-11f1-9da2-d843ae05cb18', 'Seccion_61', -77.2152, -105.0300),
  ('c0b5c72d-6687-11f1-9d41-d843ae05cb18', 'Seccion_61', -77.2152, -105.0300),
  ('7ede7c5b-6436-11f1-9da2-d843ae05cb18', 'Depto_servico_escolares_Div_estudios_profecionales_Direccion', -52.0612, 0.0448);

CREATE TABLE IF NOT EXISTS buildings_backup_20260804_glb_actual (LIKE buildings INCLUDING ALL);
INSERT INTO buildings_backup_20260804_glb_actual
SELECT b.*
FROM buildings b
INNER JOIN target_building_model_coordinates t ON t.id = b.id
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS calibration_points_backup_20260804_glb_actual (LIKE campus_calibration_points INCLUDING ALL);
INSERT INTO calibration_points_backup_20260804_glb_actual
SELECT cp.*
FROM campus_calibration_points cp
INNER JOIN target_building_model_coordinates t ON t.id = cp.building_id
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS calibration_profiles_backup_20260804_glb_actual (LIKE campus_calibration_profiles INCLUDING ALL);
INSERT INTO calibration_profiles_backup_20260804_glb_actual
SELECT profile.* FROM campus_calibration_profiles profile
ON CONFLICT (id) DO NOTHING;

UPDATE buildings b
SET x = t.x,
    z = t.z
FROM target_building_model_coordinates t
WHERE b.id = t.id
  AND b.model_node_name = t.model_node_name;

-- Los puntos guardan una copia de X/Z; se sincronizan con el nodo actual.
UPDATE campus_calibration_points cp
SET model_x = b.x,
    model_z = b.z
FROM buildings b
INNER JOIN target_building_model_coordinates t ON t.id = b.id
WHERE cp.building_id = b.id;

-- Un perfil affine calculado contra el modelo anterior no debe seguir activo.
UPDATE campus_calibration_profiles SET is_active = FALSE WHERE is_active = TRUE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM target_building_model_coordinates t
    LEFT JOIN buildings b ON b.id = t.id
    WHERE b.id IS NULL
       OR b.model_node_name <> t.model_node_name
       OR ABS(b.x - t.x) > 0.0001
       OR ABS(b.z - t.z) > 0.0001
  ) THEN
    RAISE EXCEPTION 'La verificación de coordenadas GLB falló; se revierte la transacción';
  END IF;
END $$;

COMMIT;
