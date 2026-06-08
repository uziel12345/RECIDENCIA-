-- ============================================================
-- Módulo: Aulas (classrooms)
-- Fecha: 2026-06-08
--
-- Aplica con:
--   mysql -u <usuario> -p mapa_ito < docs/migration-classrooms-20260608.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS classrooms (
  id          VARCHAR(36)   NOT NULL,
  building_id VARCHAR(36)   NOT NULL,
  code        VARCHAR(32)   NOT NULL,
  name        VARCHAR(255)  NOT NULL,
  floor       INT           NOT NULL DEFAULT 0,
  capacity    INT UNSIGNED  NULL,
  type        ENUM('aula','laboratorio','taller','oficina','otro') NOT NULL DEFAULT 'aula',
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME      NULL DEFAULT NULL
    COMMENT 'Timestamp del soft delete; NULL = registro activo',

  PRIMARY KEY (id),
  UNIQUE KEY uq_classroom_building_code (building_id, code),
  KEY idx_classrooms_building (building_id),
  KEY idx_classrooms_active   (is_active),
  CONSTRAINT fk_classrooms_building
    FOREIGN KEY (building_id) REFERENCES buildings (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
