-- Corrige amarres buildings.model_node_name contra nombres reales de campus.glb.
-- Esto permite que las etiquetas se posicionen sobre el mesh del edificio.

START TRANSACTION;

UPDATE buildings SET model_node_name = 'Aulas_Ñ' WHERE code = 'N';
UPDATE buildings SET model_node_name = 'Edificio_3D_1007' WHERE code = '1007';
UPDATE buildings SET model_node_name = 'Edificio_3D_1008' WHERE code = '1008';
UPDATE buildings SET model_node_name = 'Edificio_3D_1009' WHERE code = '1009';
UPDATE buildings SET model_node_name = 'Audiovisual_de_Postgrado001' WHERE code = 'AUD-POS';
UPDATE buildings SET model_node_name = 'Cubiculo_de_Maestros' WHERE code = 'CUB-MAE';
UPDATE buildings SET model_node_name = 'Cubiculos_de_Doctorado001' WHERE code = 'CUB-DOC';
UPDATE buildings SET model_node_name = 'DEPARTAMENTO_DE_INGENIERÍA_QUÍMICA_Y_BIOQUÍMICA' WHERE code = 'DQB';
UPDATE buildings SET model_node_name = 'DEPARTAMENTO_DE_INGENIERÍA_ELECTRÓNICA' WHERE code = 'DEL';
UPDATE buildings SET model_node_name = 'Departamento_de_Ciencias_Basicas_Departamento_de_Ciencias_Basicas' WHERE code = 'CB';
UPDATE buildings SET model_node_name = 'Eduficio_C' WHERE code = 'C';
UPDATE buildings SET model_node_name = 'Edificio__L_' WHERE code = 'L';
UPDATE buildings SET model_node_name = 'Laboratorio_de_Ing_Civil001' WHERE code = 'LAB-CIV';
UPDATE buildings SET model_node_name = 'Edificios_3D_12_en_emplazamiento_plano' WHERE code = 'LAB-ELE';
UPDATE buildings SET model_node_name = 'Edificios_3D_3_en_emplazamiento_plano' WHERE code = 'FQ';
UPDATE buildings SET model_node_name = 'Laboratorio_de_ing__Quimica' WHERE code = 'LAB-QUI';
UPDATE buildings SET model_node_name = 'Contenido_de_geolocalización' WHERE code = 'GEO';
UPDATE buildings SET model_node_name = 'Maestria_en_Administracion' WHERE code = 'MAE-ADM';
UPDATE buildings SET model_node_name = 'Edificio_de_Postgrado001' WHERE code = 'POS';
UPDATE buildings SET model_node_name = 'Edificios_3D_6_en_emplazamiento_plano' WHERE code = 'SAL';

COMMIT;
