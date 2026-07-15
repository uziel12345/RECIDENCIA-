-- Barra lateral: información completa de edificio (aulas, departamentos,
-- cubículos de maestros, jefaturas, horarios) + trámites extendidos.
-- Aplicar con: mysql -u root -p mapa_ito < docs/migration-building-full-details-20260708.sql
-- Todo aditivo (CREATE TABLE IF NOT EXISTS / ALTER TABLE ADD COLUMN), seguro sobre datos existentes.

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ============================================================
-- building_schedules
-- day_of_week: 1=Lunes … 7=Domingo (ISO), igual que la tabla `schedules`
-- ============================================================
CREATE TABLE IF NOT EXISTS building_schedules (
  id          VARCHAR(36)   NOT NULL,
  building_id VARCHAR(36)   NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL COMMENT '1=Lunes…7=Domingo (ISO)',
  open_time   TIME          NOT NULL,
  close_time  TIME          NOT NULL,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME      NULL DEFAULT NULL
    COMMENT 'Timestamp del soft delete; NULL = registro activo',

  PRIMARY KEY (id),
  KEY idx_building_schedules_building (building_id),
  KEY idx_building_schedules_active   (is_active),
  CONSTRAINT fk_building_schedules_building
    FOREIGN KEY (building_id) REFERENCES buildings (id),
  CONSTRAINT chk_building_schedules_day   CHECK (day_of_week BETWEEN 1 AND 7),
  CONSTRAINT chk_building_schedules_times CHECK (open_time < close_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- departments (departamentos dentro de un edificio)
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id            VARCHAR(36)   NOT NULL,
  building_id   VARCHAR(36)   NOT NULL,
  name          VARCHAR(255)  NOT NULL,
  description   TEXT          NULL,
  schedule_text VARCHAR(255)  NULL,
  head_name     VARCHAR(255)  NULL,
  contact       VARCHAR(255)  NULL,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME      NULL DEFAULT NULL
    COMMENT 'Timestamp del soft delete; NULL = registro activo',

  PRIMARY KEY (id),
  KEY idx_departments_building (building_id),
  KEY idx_departments_active   (is_active),
  CONSTRAINT fk_departments_building
    FOREIGN KEY (building_id) REFERENCES buildings (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- teacher_cubicles (cubículos de maestros)
-- ============================================================
CREATE TABLE IF NOT EXISTS teacher_cubicles (
  id            VARCHAR(36)   NOT NULL,
  building_id   VARCHAR(36)   NOT NULL,
  code          VARCHAR(32)   NOT NULL,
  professor_id  VARCHAR(36)   NULL,
  department_id VARCHAR(36)   NULL,
  schedule_text VARCHAR(255)  NULL,
  notes         TEXT          NULL,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME      NULL DEFAULT NULL
    COMMENT 'Timestamp del soft delete; NULL = registro activo',

  PRIMARY KEY (id),
  UNIQUE KEY uq_cubicle_building_code (building_id, code),
  KEY idx_cubicles_building   (building_id),
  KEY idx_cubicles_professor  (professor_id),
  KEY idx_cubicles_department (department_id),
  KEY idx_cubicles_active     (is_active),
  CONSTRAINT fk_cubicles_building
    FOREIGN KEY (building_id) REFERENCES buildings (id),
  CONSTRAINT fk_cubicles_professor
    FOREIGN KEY (professor_id) REFERENCES professors (id) ON DELETE SET NULL,
  CONSTRAINT fk_cubicles_department
    FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- headquarters (jefaturas)
-- ============================================================
CREATE TABLE IF NOT EXISTS headquarters (
  id            VARCHAR(36)   NOT NULL,
  building_id   VARCHAR(36)   NOT NULL,
  name          VARCHAR(255)  NOT NULL,
  head_name     VARCHAR(255)  NULL,
  department_id VARCHAR(36)   NULL,
  schedule_text VARCHAR(255)  NULL,
  contact       VARCHAR(255)  NULL,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME      NULL DEFAULT NULL
    COMMENT 'Timestamp del soft delete; NULL = registro activo',

  PRIMARY KEY (id),
  KEY idx_headquarters_building   (building_id),
  KEY idx_headquarters_department (department_id),
  KEY idx_headquarters_active     (is_active),
  CONSTRAINT fk_headquarters_building
    FOREIGN KEY (building_id) REFERENCES buildings (id),
  CONSTRAINT fk_headquarters_department
    FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Columnas aditivas
-- ============================================================
ALTER TABLE classrooms
  ADD COLUMN description TEXT NULL AFTER name;

ALTER TABLE procedures
  ADD COLUMN resource_url VARCHAR(1024) NULL AFTER description;

ALTER TABLE procedure_requirements
  ADD COLUMN type ENUM('requisito','documento') NOT NULL DEFAULT 'requisito' AFTER description;

SET foreign_key_checks = 1;
