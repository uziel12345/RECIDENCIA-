-- Safe base migration for academic professor schedules.
-- Creates missing professors and schedules tables without deleting existing data.
-- Apply before docs/migration-professor-schedule-import-20260615.sql on databases
-- that do not have these base tables yet.

CREATE TABLE IF NOT EXISTS professors (
  id              VARCHAR(36)   NOT NULL,
  employee_number VARCHAR(20)   NOT NULL,
  rfc             VARCHAR(13)   NULL,
  full_name       VARCHAR(255)  NOT NULL,
  email           VARCHAR(255)  NULL,
  department      VARCHAR(255)  NOT NULL,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME      NULL DEFAULT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uk_professors_employee_number (employee_number),
  KEY idx_professors_rfc        (rfc),
  KEY idx_professors_is_active  (is_active),
  KEY idx_professors_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schedules (
  id           VARCHAR(36)   NOT NULL,
  subject      VARCHAR(255)  NOT NULL,
  subject_code VARCHAR(50)   NULL,
  subject_name VARCHAR(255)  NULL,
  professor_id VARCHAR(36)   NOT NULL,
  classroom_id VARCHAR(36)   NOT NULL,
  day_of_week  TINYINT UNSIGNED NOT NULL COMMENT '1=Lunes...7=Domingo (ISO)',
  start_time   TIME          NOT NULL,
  end_time     TIME          NOT NULL,
  period       VARCHAR(10)   NOT NULL COMMENT 'Ej: 2026-1',
  group_code   VARCHAR(50)   NULL,
  career_code  VARCHAR(50)   NULL,
  career_name  VARCHAR(255)  NULL,
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
