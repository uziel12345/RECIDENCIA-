-- Normaliza nombres de edificios extra que aparecen en el listado admin
-- pero no forman parte de la tabla numerada del croquis compartido.

START TRANSACTION;

UPDATE buildings
SET name = 'AUDIOVISUAL DE POSGRADO'
WHERE code = 'AUD-POS';

UPDATE buildings
SET name = 'AULA 1007'
WHERE code = '1007';

UPDATE buildings
SET name = 'AULA 1008'
WHERE code = '1008';

UPDATE buildings
SET name = 'AULA 1009'
WHERE code = '1009';

UPDATE navigation_nodes n
INNER JOIN buildings b ON n.code = CONCAT('n-acceso-', b.slug)
SET n.name = CONCAT('Acceso ', b.name)
WHERE b.code IN ('AUD-POS', '1007', '1008', '1009');

COMMIT;

