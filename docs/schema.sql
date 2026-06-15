-- ============================================================
-- SCHEMA BASE — Mapa 3D ITO
-- Generado: 2026-06-08
-- Reconstruido a partir de todas las migraciones en docs/
-- Ejecutable de principio a fin en una BD vacía.
--
-- Uso:
--   mysql -u <usuario> -p -e "CREATE DATABASE IF NOT EXISTS mapa_ito CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
--   mysql -u <usuario> -p mapa_ito < docs/schema.sql
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

-- ============================================================
-- 1. admin_users
-- (incluye columnas de migration-admin-lockout y migration-admin-token-version)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id                     VARCHAR(36)   NOT NULL,
  username               VARCHAR(80)   NOT NULL,
  full_name              VARCHAR(255)  NOT NULL,
  email                  VARCHAR(255)  NOT NULL,
  password_hash          VARCHAR(255)  NOT NULL,
  role                   ENUM('superadmin','admin','servicios_escolares','recursos_humanos','viewer') NOT NULL,
  is_active              TINYINT(1)    NOT NULL DEFAULT 1,
  failed_login_attempts  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until           DATETIME      NULL DEFAULT NULL,
  token_version          INT UNSIGNED  NOT NULL DEFAULT 1,
  last_login_at          DATETIME      NULL DEFAULT NULL,
  created_at             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_username (username),
  UNIQUE KEY uq_admin_email    (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. building_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS building_categories (
  id          VARCHAR(36)  NOT NULL,
  code        VARCHAR(32)  NOT NULL,
  name        VARCHAR(64)  NOT NULL,
  description TEXT         NULL,
  color_hex   VARCHAR(7)   NOT NULL DEFAULT '#64748b',
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_category_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. buildings
-- (incluye deleted_at de migration-buildings-deleted-at)
-- ============================================================
CREATE TABLE IF NOT EXISTS buildings (
  id              VARCHAR(36)   NOT NULL,
  category_id     VARCHAR(36)   NOT NULL,
  code            VARCHAR(16)   NOT NULL,
  name            VARCHAR(255)  NOT NULL,
  slug            VARCHAR(255)  NOT NULL,
  description     TEXT          NULL,
  model_node_name VARCHAR(255)  NULL,
  x               FLOAT         NULL,
  y               FLOAT         NULL DEFAULT 0,
  z               FLOAT         NULL,
  latitude        DECIMAL(10,8) NULL,
  longitude       DECIMAL(11,8) NULL,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  is_priority     TINYINT(1)    NOT NULL DEFAULT 0,
  deleted_at      DATETIME      NULL DEFAULT NULL
    COMMENT 'Timestamp del soft delete; NULL = registro activo',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_building_code (code),
  UNIQUE KEY uq_building_slug (slug),
  KEY idx_buildings_category (category_id),
  KEY idx_buildings_active    (is_active),
  CONSTRAINT fk_buildings_category
    FOREIGN KEY (category_id) REFERENCES building_categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. building_images
-- ============================================================
CREATE TABLE IF NOT EXISTS building_images (
  id           VARCHAR(36)    NOT NULL,
  building_id  VARCHAR(36)    NOT NULL,
  image_url    VARCHAR(1024)  NOT NULL,
  image_type   VARCHAR(32)    NOT NULL DEFAULT 'photo',
  title        VARCHAR(255)   NULL,
  description  TEXT           NULL,
  is_cover     TINYINT(1)     NOT NULL DEFAULT 0,
  sort_order   INT            NOT NULL DEFAULT 0,
  is_active    TINYINT(1)     NOT NULL DEFAULT 1,
  created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_images_building (building_id),
  KEY idx_images_cover    (building_id, is_cover, is_active),
  CONSTRAINT fk_images_building
    FOREIGN KEY (building_id) REFERENCES buildings (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. building_services
-- ============================================================
CREATE TABLE IF NOT EXISTS building_services (
  id           VARCHAR(36)   NOT NULL,
  building_id  VARCHAR(36)   NOT NULL,
  name         VARCHAR(255)  NOT NULL,
  description  VARCHAR(500)  NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_building_services_building (building_id),
  CONSTRAINT fk_building_services_building
    FOREIGN KEY (building_id) REFERENCES buildings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. navigation_nodes
-- ============================================================
CREATE TABLE IF NOT EXISTS navigation_nodes (
  id          VARCHAR(36)   NOT NULL,
  code        VARCHAR(255)  NOT NULL,
  name        VARCHAR(255)  NULL,
  node_type   ENUM('waypoint','entrance','intersection') NOT NULL,
  x           FLOAT         NOT NULL,
  y           FLOAT         NOT NULL DEFAULT 0,
  z           FLOAT         NOT NULL,
  latitude    DECIMAL(10,8) NULL,
  longitude   DECIMAL(11,8) NULL,
  floor_level INT           NOT NULL DEFAULT 0,
  is_walkable TINYINT(1)    NOT NULL DEFAULT 1,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  metadata    JSON          NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_node_code (code),
  KEY idx_nodes_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. navigation_edges
-- ============================================================
CREATE TABLE IF NOT EXISTS navigation_edges (
  id               VARCHAR(36)  NOT NULL,
  from_node_id     VARCHAR(36)  NOT NULL,
  to_node_id       VARCHAR(36)  NOT NULL,
  distance         FLOAT        NOT NULL,
  is_bidirectional TINYINT(1)   NOT NULL DEFAULT 1,
  is_accessible    TINYINT(1)   NOT NULL DEFAULT 1,
  path_type        VARCHAR(32)  NOT NULL DEFAULT 'sidewalk',
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,
  metadata         JSON         NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_edge_direction (from_node_id, to_node_id),
  KEY idx_edges_from   (from_node_id),
  KEY idx_edges_to     (to_node_id),
  KEY idx_edges_active (is_active),
  CONSTRAINT fk_edges_from FOREIGN KEY (from_node_id) REFERENCES navigation_nodes (id),
  CONSTRAINT fk_edges_to   FOREIGN KEY (to_node_id)   REFERENCES navigation_nodes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. building_entrances
-- ============================================================
CREATE TABLE IF NOT EXISTS building_entrances (
  id             VARCHAR(36)  NOT NULL,
  building_id    VARCHAR(36)  NOT NULL,
  node_id        VARCHAR(36)  NOT NULL,
  entrance_name  VARCHAR(255) NULL,
  entrance_type  VARCHAR(32)  NOT NULL DEFAULT 'main',
  is_primary     TINYINT(1)   NOT NULL DEFAULT 0,
  is_accessible  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_entrances_building (building_id),
  KEY idx_entrances_node     (node_id),
  CONSTRAINT fk_entrances_building
    FOREIGN KEY (building_id) REFERENCES buildings (id),
  CONSTRAINT fk_entrances_node
    FOREIGN KEY (node_id) REFERENCES navigation_nodes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. classrooms
-- (de migration-classrooms-20260608.sql)
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

-- ============================================================
-- 9. procedures
-- (de migration-procedures-20260608.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS procedures (
  id           VARCHAR(36)   NOT NULL,
  name         VARCHAR(255)  NOT NULL,
  slug         VARCHAR(255)  NOT NULL,
  description  TEXT          NULL,
  kind         ENUM('tramite','servicio') NOT NULL,
  is_active    TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   DATETIME      NULL DEFAULT NULL
    COMMENT 'Timestamp del soft delete; NULL = registro activo',

  PRIMARY KEY (id),
  UNIQUE KEY uq_procedure_slug  (slug),
  KEY idx_procedures_kind       (kind),
  KEY idx_procedures_active     (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. procedure_requirements
-- ============================================================
CREATE TABLE IF NOT EXISTS procedure_requirements (
  id             VARCHAR(36)  NOT NULL,
  procedure_id   VARCHAR(36)  NOT NULL,
  description    TEXT         NOT NULL,
  is_mandatory   TINYINT(1)   NOT NULL DEFAULT 1,
  display_order  INT          NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_req_procedure (procedure_id),
  KEY idx_req_order     (procedure_id, display_order),
  CONSTRAINT fk_req_procedure
    FOREIGN KEY (procedure_id) REFERENCES procedures (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. building_procedures
-- ============================================================
CREATE TABLE IF NOT EXISTS building_procedures (
  building_id   VARCHAR(36)   NOT NULL,
  procedure_id  VARCHAR(36)   NOT NULL,
  notes         VARCHAR(500)  NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (building_id, procedure_id),
  KEY idx_bp_procedure (procedure_id),
  CONSTRAINT fk_bp_building
    FOREIGN KEY (building_id) REFERENCES buildings (id),
  CONSTRAINT fk_bp_procedure
    FOREIGN KEY (procedure_id) REFERENCES procedures (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. audit_logs
-- (de migration-audit-logs-20260602.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id            INT UNSIGNED  AUTO_INCREMENT NOT NULL,
  admin_user_id VARCHAR(36)   NULL,
  action        VARCHAR(64)   NOT NULL,
  resource_type VARCHAR(32)   NULL,
  resource_id   VARCHAR(36)   NULL,
  details       JSON          NULL,
  ip_address    VARCHAR(45)   NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_audit_user       (admin_user_id),
  KEY idx_audit_action     (action),
  KEY idx_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. students
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id             VARCHAR(36)   NOT NULL,
  control_number VARCHAR(20)   NOT NULL,
  full_name      VARCHAR(255)  NOT NULL,
  email          VARCHAR(255)  NULL,
  program        VARCHAR(255)  NOT NULL,
  semester       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  is_active      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at     DATETIME      NULL DEFAULT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uk_students_control_number (control_number),
  KEY idx_students_is_active  (is_active),
  KEY idx_students_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. professors
-- ============================================================
CREATE TABLE IF NOT EXISTS professors (
  id              VARCHAR(36)   NOT NULL,
  employee_number VARCHAR(20)   NOT NULL,
  full_name       VARCHAR(255)  NOT NULL,
  email           VARCHAR(255)  NULL,
  department      VARCHAR(255)  NOT NULL,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME      NULL DEFAULT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uk_professors_employee_number (employee_number),
  KEY idx_professors_is_active  (is_active),
  KEY idx_professors_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. schedules
-- day_of_week: 1=Lunes … 5=Viernes (ISO 8601; fin de semana permitido 6-7)
-- ============================================================
CREATE TABLE IF NOT EXISTS schedules (
  id           VARCHAR(36)   NOT NULL,
  subject      VARCHAR(255)  NOT NULL,
  professor_id VARCHAR(36)   NOT NULL,
  classroom_id VARCHAR(36)   NOT NULL,
  day_of_week  TINYINT UNSIGNED NOT NULL COMMENT '1=Lunes…7=Domingo (ISO)',
  start_time   TIME          NOT NULL,
  end_time     TIME          NOT NULL,
  period       VARCHAR(10)   NOT NULL COMMENT 'Ej: 2026-1',
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_schedules_professor    (professor_id),
  KEY idx_schedules_classroom    (classroom_id),
  KEY idx_schedules_period_day   (period, day_of_week),
  CONSTRAINT fk_schedules_professor
    FOREIGN KEY (professor_id) REFERENCES professors (id),
  CONSTRAINT fk_schedules_classroom
    FOREIGN KEY (classroom_id) REFERENCES classrooms (id),
  CONSTRAINT chk_schedules_day   CHECK (day_of_week BETWEEN 1 AND 7),
  CONSTRAINT chk_schedules_times CHECK (start_time < end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. student_schedules  (N:M alumno ↔ horario)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_schedules (
  student_id  VARCHAR(36) NOT NULL,
  schedule_id VARCHAR(36) NOT NULL,

  PRIMARY KEY (student_id, schedule_id),
  KEY idx_ss_schedule (schedule_id),
  CONSTRAINT fk_ss_student
    FOREIGN KEY (student_id)  REFERENCES students  (id),
  CONSTRAINT fk_ss_schedule
    FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATOS INICIALES: categorías de edificios
-- ============================================================
INSERT IGNORE INTO building_categories (id, code, name, description, color_hex, is_active) VALUES
  (UUID(), 'aulas',         'Aulas',          'Salones de clase y talleres',           '#2563eb', 1),
  (UUID(), 'laboratorio',   'Laboratorio',    'Laboratorios y talleres especializados', '#16a34a', 1),
  (UUID(), 'administrativo','Administrativo', 'Oficinas y departamentos académicos',    '#7c3aed', 1),
  (UUID(), 'servicio',      'Servicios',      'Servicios estudiantiles y generales',    '#f59e0b', 1),
  (UUID(), 'biblioteca',    'Biblioteca',     'Biblioteca y centros de información',    '#0891b2', 1);

SET foreign_key_checks = 1;
