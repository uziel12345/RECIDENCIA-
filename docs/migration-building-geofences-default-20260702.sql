-- Geocercas iniciales por edificio con GPS.
-- Crea un cuadro aproximado de 20 m alrededor del punto GPS del edificio.
-- Sirve como primera capa de deteccion; despues se pueden reemplazar por
-- poligonos dibujados con mayor precision por edificio.

INSERT INTO building_geofences
  (id, building_id, name, polygon, priority, is_active)
SELECT
  UUID(),
  b.id,
  CONCAT('Geocerca inicial ', b.code),
  JSON_ARRAY(
    JSON_OBJECT('lat', b.latitude + 0.00017966, 'lng', b.longitude - 0.00018795),
    JSON_OBJECT('lat', b.latitude + 0.00017966, 'lng', b.longitude + 0.00018795),
    JSON_OBJECT('lat', b.latitude - 0.00017966, 'lng', b.longitude + 0.00018795),
    JSON_OBJECT('lat', b.latitude - 0.00017966, 'lng', b.longitude - 0.00018795)
  ),
  0,
  1
FROM buildings b
WHERE b.is_active = TRUE
  AND b.latitude IS NOT NULL
  AND b.longitude IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM building_geofences bg
    WHERE bg.building_id = b.id
      AND bg.is_active = TRUE
  );
