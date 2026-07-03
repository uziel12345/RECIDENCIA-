-- ============================================================
-- Sistema de geolocalizacion real: calibracion y geocercas
-- Fecha: 2026-07-02
--
-- Objetivo:
-- 1. Guardar puntos GPS reales tomados caminando el campus.
-- 2. Guardar la transformacion afin vigente GPS -> modelo 3D.
-- 3. Guardar poligonos por edificio para detectar "estoy dentro" en vez
--    de depender solo del centro del edificio mas cercano.
-- ============================================================

CREATE TABLE IF NOT EXISTS campus_calibration_points (
  id              VARCHAR(36)  NOT NULL,
  building_id     VARCHAR(36)  NULL,
  label           VARCHAR(255) NOT NULL,
  latitude        DECIMAL(10,8) NOT NULL,
  longitude       DECIMAL(11,8) NOT NULL,
  accuracy_meters FLOAT        NULL,
  model_x         FLOAT        NOT NULL,
  model_z         FLOAT        NOT NULL,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_calib_points_building (building_id),
  KEY idx_calib_points_active (is_active),
  CONSTRAINT fk_calib_points_building
    FOREIGN KEY (building_id) REFERENCES buildings (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS campus_calibration_profiles (
  id          VARCHAR(36) NOT NULL,
  name        VARCHAR(120) NOT NULL,
  ref_lat     DECIMAL(10,8) NOT NULL,
  ref_lng     DECIMAL(11,8) NOT NULL,
  meters_lat  FLOAT NOT NULL,
  meters_lng  FLOAT NOT NULL,
  a_x         DOUBLE NOT NULL,
  b_x         DOUBLE NOT NULL,
  c_x         DOUBLE NOT NULL,
  a_z         DOUBLE NOT NULL,
  b_z         DOUBLE NOT NULL,
  c_z         DOUBLE NOT NULL,
  max_residual_meters FLOAT NULL,
  avg_residual_meters FLOAT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_calib_profiles_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS building_geofences (
  id          VARCHAR(36) NOT NULL,
  building_id VARCHAR(36) NOT NULL,
  name        VARCHAR(160) NULL,
  polygon     JSON NOT NULL COMMENT 'Array de vertices [{lat,lng}] en orden',
  priority    INT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_geofences_building (building_id),
  KEY idx_geofences_active (is_active),
  CONSTRAINT fk_geofences_building
    FOREIGN KEY (building_id) REFERENCES buildings (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
