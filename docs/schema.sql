-- ============================================================
-- SCHEMA BASE — Mapa 3D ITO
-- Generado: 2026-06-08
-- Migrado a PostgreSQL: 2026-07-23 (antes MySQL — ver historial de git
-- para la version mysql si hace falta consultarla)
-- Reconstruido a partir de todas las migraciones en docs/
-- Ejecutable de principio a fin en una BD vacia.
--
-- Uso:
--   createdb -U <usuario> mapa_ito
--   psql -U <usuario> -d mapa_ito -f docs/schema.sql
-- ============================================================

-- ============================================================
-- Funcion reutilizable para emular el ON UPDATE CURRENT_TIMESTAMP
-- de MySQL: cada tabla con columna updated_at le engancha un trigger
-- BEFORE UPDATE que llama a esta funcion.
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
  role                   VARCHAR(32)   NOT NULL
    CONSTRAINT chk_admin_role CHECK (role IN ('superadmin','admin','servicios_escolares','recursos_humanos','viewer')),
  is_active              BOOLEAN       NOT NULL DEFAULT TRUE,
  failed_login_attempts  SMALLINT      NOT NULL DEFAULT 0,
  locked_until           TIMESTAMP     NULL DEFAULT NULL,
  token_version          INTEGER       NOT NULL DEFAULT 1,
  last_login_at          TIMESTAMP     NULL DEFAULT NULL,
  created_at             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_admin_users PRIMARY KEY (id),
  CONSTRAINT uq_admin_username UNIQUE (username),
  CONSTRAINT uq_admin_email    UNIQUE (email)
);
CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 2. building_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS building_categories (
  id          VARCHAR(36)  NOT NULL,
  code        VARCHAR(50)  NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT         NULL,
  color_hex   VARCHAR(7)   NOT NULL DEFAULT '#64748b',
  icon_name   VARCHAR(100) NULL,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_building_categories PRIMARY KEY (id),
  CONSTRAINT uq_category_code UNIQUE (code),
  CONSTRAINT uq_category_name UNIQUE (name)
);
CREATE TRIGGER trg_building_categories_updated_at
  BEFORE UPDATE ON building_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 3. buildings
-- (incluye deleted_at de migration-buildings-deleted-at)
-- ============================================================
CREATE TABLE IF NOT EXISTS buildings (
  id                VARCHAR(36)      NOT NULL,
  category_id       VARCHAR(36)      NOT NULL,
  code              VARCHAR(50)      NOT NULL,
  name              VARCHAR(255)     NOT NULL,
  slug              VARCHAR(255)     NOT NULL,
  description       TEXT             NULL,
  model_node_name   VARCHAR(255)     NULL,
  x                 DECIMAL(10,4)    NULL,
  y                 DECIMAL(10,4)    NULL DEFAULT 0,
  z                 DECIMAL(10,4)    NULL,
  latitude          DECIMAL(10,7)    NULL,
  longitude         DECIMAL(10,7)    NULL,
  address_reference TEXT             NULL,
  is_active         BOOLEAN          NOT NULL DEFAULT TRUE,
  is_priority       BOOLEAN          NOT NULL DEFAULT FALSE,
  -- deleted_at: timestamp del soft delete; NULL = registro activo
  deleted_at        TIMESTAMP        NULL DEFAULT NULL,
  created_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_buildings PRIMARY KEY (id),
  CONSTRAINT uq_building_code UNIQUE (code),
  CONSTRAINT uq_building_slug UNIQUE (slug),
  CONSTRAINT fk_buildings_category
    FOREIGN KEY (category_id) REFERENCES building_categories (id) ON DELETE RESTRICT
);
CREATE INDEX idx_buildings_category ON buildings (category_id);
CREATE INDEX idx_buildings_active   ON buildings (is_active);
CREATE INDEX idx_buildings_name     ON buildings (name);
CREATE INDEX idx_buildings_model_node_name ON buildings (model_node_name);
CREATE TRIGGER trg_buildings_updated_at
  BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 4. building_images
-- ============================================================
CREATE TABLE IF NOT EXISTS building_images (
  id           VARCHAR(36)    NOT NULL,
  building_id  VARCHAR(36)    NOT NULL,
  image_url    TEXT           NOT NULL,
  image_type   VARCHAR(32)    NOT NULL DEFAULT 'photo',
  title        VARCHAR(150)   NULL,
  description  TEXT           NULL,
  is_cover     BOOLEAN        NOT NULL DEFAULT FALSE,
  sort_order   INTEGER        NOT NULL DEFAULT 0,
  is_active    BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_building_images PRIMARY KEY (id),
  CONSTRAINT fk_images_building
    FOREIGN KEY (building_id) REFERENCES buildings (id) ON DELETE CASCADE
);
CREATE INDEX idx_images_building ON building_images (building_id);
CREATE INDEX idx_images_cover    ON building_images (building_id, is_cover, is_active);
CREATE TRIGGER trg_building_images_updated_at
  BEFORE UPDATE ON building_images
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 8. classrooms
-- (de migration-classrooms-20260608.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS classrooms (
  id          VARCHAR(36)   NOT NULL,
  building_id VARCHAR(36)   NOT NULL,
  code        VARCHAR(32)   NOT NULL,
  name        VARCHAR(255)  NOT NULL,
  description TEXT          NULL,
  floor       INTEGER       NOT NULL DEFAULT 0,
  capacity    INTEGER       NULL,
  type        VARCHAR(32)   NOT NULL DEFAULT 'aula'
    CONSTRAINT chk_classrooms_type CHECK (type IN ('aula','laboratorio','taller','oficina','otro')),
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- deleted_at: timestamp del soft delete; NULL = registro activo
  deleted_at  TIMESTAMP     NULL DEFAULT NULL,

  CONSTRAINT pk_classrooms PRIMARY KEY (id),
  CONSTRAINT uq_classroom_building_code UNIQUE (building_id, code),
  CONSTRAINT fk_classrooms_building
    FOREIGN KEY (building_id) REFERENCES buildings (id)
);
CREATE INDEX idx_classrooms_building ON classrooms (building_id);
CREATE INDEX idx_classrooms_active   ON classrooms (is_active);
CREATE TRIGGER trg_classrooms_updated_at
  BEFORE UPDATE ON classrooms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 9. procedures
-- (de migration-procedures-20260608.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS procedures (
  id                VARCHAR(36)   NOT NULL,
  name              VARCHAR(255)  NOT NULL,
  slug              VARCHAR(255)  NOT NULL,
  description       TEXT          NULL,
  resource_url      VARCHAR(1024) NULL,
  kind              VARCHAR(16)   NOT NULL
    CONSTRAINT chk_procedures_kind CHECK (kind IN ('tramite','servicio')),
  -- department_id: FK a departments; agregada via ALTER TABLE mas abajo
  -- (departments se define despues en este archivo)
  department_id     VARCHAR(36)   NULL,
  internal_location VARCHAR(255)  NULL,
  schedule_text     VARCHAR(255)  NULL,
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- deleted_at: timestamp del soft delete; NULL = registro activo
  deleted_at        TIMESTAMP     NULL DEFAULT NULL,

  CONSTRAINT pk_procedures PRIMARY KEY (id),
  CONSTRAINT uq_procedure_slug UNIQUE (slug)
);
CREATE INDEX idx_procedures_kind       ON procedures (kind);
CREATE INDEX idx_procedures_active     ON procedures (is_active);
CREATE INDEX idx_procedures_department ON procedures (department_id);
CREATE TRIGGER trg_procedures_updated_at
  BEFORE UPDATE ON procedures
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 10. procedure_requirements
-- ============================================================
CREATE TABLE IF NOT EXISTS procedure_requirements (
  id             VARCHAR(36)  NOT NULL,
  procedure_id   VARCHAR(36)  NOT NULL,
  description    TEXT         NOT NULL,
  type           VARCHAR(16)  NOT NULL DEFAULT 'requisito'
    CONSTRAINT chk_procedure_req_type CHECK (type IN ('requisito','documento')),
  is_mandatory   BOOLEAN      NOT NULL DEFAULT TRUE,
  display_order  INTEGER      NOT NULL DEFAULT 0,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_procedure_requirements PRIMARY KEY (id),
  CONSTRAINT fk_req_procedure
    FOREIGN KEY (procedure_id) REFERENCES procedures (id) ON DELETE CASCADE
);
CREATE INDEX idx_req_procedure ON procedure_requirements (procedure_id);
CREATE INDEX idx_req_order     ON procedure_requirements (procedure_id, display_order);
CREATE TRIGGER trg_procedure_requirements_updated_at
  BEFORE UPDATE ON procedure_requirements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 11. building_procedures
-- ============================================================
CREATE TABLE IF NOT EXISTS building_procedures (
  building_id   VARCHAR(36)   NOT NULL,
  procedure_id  VARCHAR(36)   NOT NULL,
  notes         VARCHAR(500)  NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_building_procedures PRIMARY KEY (building_id, procedure_id),
  CONSTRAINT fk_bp_building
    FOREIGN KEY (building_id) REFERENCES buildings (id),
  CONSTRAINT fk_bp_procedure
    FOREIGN KEY (procedure_id) REFERENCES procedures (id)
);
CREATE INDEX idx_bp_procedure ON building_procedures (procedure_id);

-- ============================================================
-- 12. audit_logs
-- (de migration-audit-logs-20260602.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id            INTEGER       GENERATED ALWAYS AS IDENTITY,
  admin_user_id VARCHAR(36)   NULL,
  action        VARCHAR(64)   NOT NULL,
  resource_type VARCHAR(32)   NULL,
  resource_id   VARCHAR(36)   NULL,
  details       JSONB         NULL,
  ip_address    VARCHAR(45)   NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_audit_logs PRIMARY KEY (id)
);
CREATE INDEX idx_audit_user       ON audit_logs (admin_user_id);
CREATE INDEX idx_audit_action     ON audit_logs (action);
CREATE INDEX idx_audit_created_at ON audit_logs (created_at);

-- ============================================================
-- 13. students
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id             VARCHAR(36)   NOT NULL,
  control_number VARCHAR(20)   NOT NULL,
  full_name      VARCHAR(255)  NOT NULL,
  email          VARCHAR(255)  NULL,
  program        VARCHAR(255)  NOT NULL,
  semester       SMALLINT      NOT NULL DEFAULT 1,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at     TIMESTAMP     NULL DEFAULT NULL,

  CONSTRAINT pk_students PRIMARY KEY (id),
  CONSTRAINT uk_students_control_number UNIQUE (control_number)
);
CREATE INDEX idx_students_is_active  ON students (is_active);
CREATE INDEX idx_students_deleted_at ON students (deleted_at);
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 14. professors
-- ============================================================
CREATE TABLE IF NOT EXISTS professors (
  id              VARCHAR(36)   NOT NULL,
  employee_number VARCHAR(20)   NOT NULL,
  rfc             VARCHAR(13)   NULL,
  full_name       VARCHAR(255)  NOT NULL,
  email           VARCHAR(255)  NULL,
  department      VARCHAR(255)  NOT NULL,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP     NULL DEFAULT NULL,

  CONSTRAINT pk_professors PRIMARY KEY (id),
  CONSTRAINT uk_professors_employee_number UNIQUE (employee_number)
);
CREATE INDEX idx_professors_rfc        ON professors (rfc);
CREATE INDEX idx_professors_is_active  ON professors (is_active);
CREATE INDEX idx_professors_deleted_at ON professors (deleted_at);
CREATE TRIGGER trg_professors_updated_at
  BEFORE UPDATE ON professors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 15. schedules
-- day_of_week: 1=Lunes ... 5=Viernes (ISO 8601; fin de semana permitido 6-7)
-- ============================================================
CREATE TABLE IF NOT EXISTS schedules (
  id           VARCHAR(36)   NOT NULL,
  subject      VARCHAR(255)  NOT NULL,
  subject_code VARCHAR(50)   NULL,
  subject_name VARCHAR(255)  NULL,
  professor_id VARCHAR(36)   NOT NULL,
  classroom_id VARCHAR(36)   NOT NULL,
  -- day_of_week: 1=Lunes...7=Domingo (ISO)
  day_of_week  SMALLINT      NOT NULL,
  start_time   TIME          NOT NULL,
  end_time     TIME          NOT NULL,
  -- period: ej. 2026-1
  period       VARCHAR(10)   NOT NULL,
  group_code   VARCHAR(50)   NULL,
  career_code  VARCHAR(50)   NULL,
  career_name  VARCHAR(255)  NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_schedules PRIMARY KEY (id),
  CONSTRAINT fk_schedules_professor
    FOREIGN KEY (professor_id) REFERENCES professors (id),
  CONSTRAINT fk_schedules_classroom
    FOREIGN KEY (classroom_id) REFERENCES classrooms (id),
  CONSTRAINT chk_schedules_day   CHECK (day_of_week BETWEEN 1 AND 7),
  CONSTRAINT chk_schedules_times CHECK (start_time < end_time)
);
CREATE INDEX idx_schedules_professor  ON schedules (professor_id);
CREATE INDEX idx_schedules_classroom  ON schedules (classroom_id);
CREATE INDEX idx_schedules_period_day ON schedules (period, day_of_week);
CREATE TRIGGER trg_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 16. student_schedules  (N:M alumno <-> horario)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_schedules (
  student_id  VARCHAR(36) NOT NULL,
  schedule_id VARCHAR(36) NOT NULL,

  CONSTRAINT pk_student_schedules PRIMARY KEY (student_id, schedule_id),
  CONSTRAINT fk_ss_student
    FOREIGN KEY (student_id)  REFERENCES students  (id),
  CONSTRAINT fk_ss_schedule
    FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE CASCADE
);
CREATE INDEX idx_ss_schedule ON student_schedules (schedule_id);

-- ============================================================
-- 17. building_schedules
-- day_of_week: 1=Lunes ... 7=Domingo (ISO), igual que `schedules`
-- (de migration-building-full-details-20260708.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS building_schedules (
  id          VARCHAR(36)   NOT NULL,
  building_id VARCHAR(36)   NOT NULL,
  -- day_of_week: 1=Lunes...7=Domingo (ISO)
  day_of_week SMALLINT      NOT NULL,
  open_time   TIME          NOT NULL,
  close_time  TIME          NOT NULL,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- deleted_at: timestamp del soft delete; NULL = registro activo
  deleted_at  TIMESTAMP     NULL DEFAULT NULL,

  CONSTRAINT pk_building_schedules PRIMARY KEY (id),
  CONSTRAINT fk_building_schedules_building
    FOREIGN KEY (building_id) REFERENCES buildings (id),
  CONSTRAINT chk_building_schedules_day   CHECK (day_of_week BETWEEN 1 AND 7),
  CONSTRAINT chk_building_schedules_times CHECK (open_time < close_time)
);
CREATE INDEX idx_building_schedules_building ON building_schedules (building_id);
CREATE INDEX idx_building_schedules_active   ON building_schedules (is_active);
CREATE TRIGGER trg_building_schedules_updated_at
  BEFORE UPDATE ON building_schedules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 18. departments
-- (de migration-building-full-details-20260708.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id            VARCHAR(36)   NOT NULL,
  building_id   VARCHAR(36)   NOT NULL,
  name          VARCHAR(255)  NOT NULL,
  description   TEXT          NULL,
  schedule_text VARCHAR(255)  NULL,
  head_name     VARCHAR(255)  NULL,
  contact       VARCHAR(255)  NULL,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- deleted_at: timestamp del soft delete; NULL = registro activo
  deleted_at    TIMESTAMP     NULL DEFAULT NULL,

  CONSTRAINT pk_departments PRIMARY KEY (id),
  CONSTRAINT fk_departments_building
    FOREIGN KEY (building_id) REFERENCES buildings (id)
);
CREATE INDEX idx_departments_building ON departments (building_id);
CREATE INDEX idx_departments_active   ON departments (is_active);
CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- FK diferida de procedures.department_id (departments no existia todavia
-- cuando se definio la tabla procedures mas arriba en este archivo)
ALTER TABLE procedures
  ADD CONSTRAINT fk_procedures_department
    FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL;

-- ============================================================
-- 19. teacher_cubicles
-- (de migration-building-full-details-20260708.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS teacher_cubicles (
  id            VARCHAR(36)   NOT NULL,
  building_id   VARCHAR(36)   NOT NULL,
  code          VARCHAR(32)   NOT NULL,
  professor_id  VARCHAR(36)   NULL,
  department_id VARCHAR(36)   NULL,
  schedule_text VARCHAR(255)  NULL,
  notes         TEXT          NULL,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- deleted_at: timestamp del soft delete; NULL = registro activo
  deleted_at    TIMESTAMP     NULL DEFAULT NULL,

  CONSTRAINT pk_teacher_cubicles PRIMARY KEY (id),
  CONSTRAINT uq_cubicle_building_code UNIQUE (building_id, code),
  CONSTRAINT fk_cubicles_building
    FOREIGN KEY (building_id) REFERENCES buildings (id),
  CONSTRAINT fk_cubicles_professor
    FOREIGN KEY (professor_id) REFERENCES professors (id) ON DELETE SET NULL,
  CONSTRAINT fk_cubicles_department
    FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
);
CREATE INDEX idx_cubicles_building   ON teacher_cubicles (building_id);
CREATE INDEX idx_cubicles_professor  ON teacher_cubicles (professor_id);
CREATE INDEX idx_cubicles_department ON teacher_cubicles (department_id);
CREATE INDEX idx_cubicles_active     ON teacher_cubicles (is_active);
CREATE TRIGGER trg_teacher_cubicles_updated_at
  BEFORE UPDATE ON teacher_cubicles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 20. headquarters (jefaturas)
-- (de migration-building-full-details-20260708.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS headquarters (
  id            VARCHAR(36)   NOT NULL,
  building_id   VARCHAR(36)   NOT NULL,
  name          VARCHAR(255)  NOT NULL,
  head_name     VARCHAR(255)  NULL,
  department_id VARCHAR(36)   NULL,
  schedule_text VARCHAR(255)  NULL,
  contact       VARCHAR(255)  NULL,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- deleted_at: timestamp del soft delete; NULL = registro activo
  deleted_at    TIMESTAMP     NULL DEFAULT NULL,

  CONSTRAINT pk_headquarters PRIMARY KEY (id),
  CONSTRAINT fk_headquarters_building
    FOREIGN KEY (building_id) REFERENCES buildings (id),
  CONSTRAINT fk_headquarters_department
    FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
);
CREATE INDEX idx_headquarters_building   ON headquarters (building_id);
CREATE INDEX idx_headquarters_department ON headquarters (department_id);
CREATE INDEX idx_headquarters_active     ON headquarters (is_active);
CREATE TRIGGER trg_headquarters_updated_at
  BEFORE UPDATE ON headquarters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 21. gates (puertas / accesos del campus)
-- Coordenadas crudas x/y/z — no son objetos nombrados del modelo 3D,
-- no llevan model_node_name.
-- (de migration-gates-and-procedure-service-fields-20260708.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS gates (
  id          VARCHAR(36)      NOT NULL,
  name        VARCHAR(255)     NOT NULL,
  description TEXT             NULL,
  access_type VARCHAR(16)      NOT NULL DEFAULT 'peatonal'
    CONSTRAINT chk_gates_access_type CHECK (access_type IN ('peatonal','vehicular','mixto')),
  status      VARCHAR(16)      NOT NULL DEFAULT 'abierta'
    CONSTRAINT chk_gates_status CHECK (status IN ('abierta','cerrada','solo_entrada','solo_salida')),
  x           DOUBLE PRECISION NOT NULL,
  y           DOUBLE PRECISION NOT NULL DEFAULT 0,
  z           DOUBLE PRECISION NOT NULL,
  is_active   BOOLEAN          NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- deleted_at: timestamp del soft delete; NULL = registro activo
  deleted_at  TIMESTAMP        NULL DEFAULT NULL,

  CONSTRAINT pk_gates PRIMARY KEY (id)
);
CREATE INDEX idx_gates_active ON gates (is_active);
CREATE TRIGGER trg_gates_updated_at
  BEFORE UPDATE ON gates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 22. campus_calibration_points
-- Puntos GPS reales tomados caminando el campus.
-- (de migration-geolocation-calibration-geofences-20260702.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS campus_calibration_points (
  id              VARCHAR(36)      NOT NULL,
  building_id     VARCHAR(36)      NULL,
  label           VARCHAR(255)     NOT NULL,
  latitude        DECIMAL(10,8)    NOT NULL,
  longitude       DECIMAL(11,8)    NOT NULL,
  accuracy_meters DOUBLE PRECISION NULL,
  model_x         DOUBLE PRECISION NOT NULL,
  model_z         DOUBLE PRECISION NOT NULL,
  is_active       BOOLEAN          NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_campus_calibration_points PRIMARY KEY (id),
  CONSTRAINT fk_calib_points_building
    FOREIGN KEY (building_id) REFERENCES buildings (id)
);
CREATE INDEX idx_calib_points_building ON campus_calibration_points (building_id);
CREATE INDEX idx_calib_points_active   ON campus_calibration_points (is_active);

-- ============================================================
-- 23. campus_calibration_profiles
-- Transformacion afin vigente GPS -> modelo 3D.
-- (de migration-geolocation-calibration-geofences-20260702.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS campus_calibration_profiles (
  id                  VARCHAR(36)      NOT NULL,
  name                VARCHAR(120)     NOT NULL,
  ref_lat             DECIMAL(10,8)    NOT NULL,
  ref_lng             DECIMAL(11,8)    NOT NULL,
  meters_lat          DOUBLE PRECISION NOT NULL,
  meters_lng          DOUBLE PRECISION NOT NULL,
  a_x                 DOUBLE PRECISION NOT NULL,
  b_x                 DOUBLE PRECISION NOT NULL,
  c_x                 DOUBLE PRECISION NOT NULL,
  a_z                 DOUBLE PRECISION NOT NULL,
  b_z                 DOUBLE PRECISION NOT NULL,
  c_z                 DOUBLE PRECISION NOT NULL,
  max_residual_meters DOUBLE PRECISION NULL,
  avg_residual_meters DOUBLE PRECISION NULL,
  is_active           BOOLEAN          NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_campus_calibration_profiles PRIMARY KEY (id)
);
CREATE INDEX idx_calib_profiles_active ON campus_calibration_profiles (is_active);

-- ============================================================
-- 24. building_geofences
-- Poligonos por edificio para detectar "estoy dentro" en vez de
-- depender solo del centro del edificio mas cercano.
-- (de migration-geolocation-calibration-geofences-20260702.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS building_geofences (
  id          VARCHAR(36)   NOT NULL,
  building_id VARCHAR(36)   NOT NULL,
  name        VARCHAR(160)  NULL,
  -- polygon: array de vertices [{lat,lng}] en orden
  polygon     JSONB         NOT NULL,
  priority    INTEGER       NOT NULL DEFAULT 0,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_building_geofences PRIMARY KEY (id),
  CONSTRAINT fk_geofences_building
    FOREIGN KEY (building_id) REFERENCES buildings (id)
);
CREATE INDEX idx_geofences_building ON building_geofences (building_id);
CREATE INDEX idx_geofences_active   ON building_geofences (is_active);
CREATE TRIGGER trg_building_geofences_updated_at
  BEFORE UPDATE ON building_geofences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- DATOS INICIALES: categorias de edificios
-- ============================================================
INSERT INTO building_categories (id, code, name, description, color_hex, icon_name, is_active) VALUES
  (gen_random_uuid(), 'aulas',         'Aulas',          'Salones de clase y talleres',           '#2563eb', 'school',    TRUE),
  (gen_random_uuid(), 'laboratorio',   'Laboratorio',    'Laboratorios y talleres especializados', '#16a34a', 'flask',     TRUE),
  (gen_random_uuid(), 'administrativo','Administrativo', 'Oficinas y departamentos academicos',    '#7c3aed', 'building',  TRUE),
  (gen_random_uuid(), 'servicio',      'Servicios',      'Servicios estudiantiles y generales',    '#f59e0b', 'briefcase', TRUE),
  (gen_random_uuid(), 'biblioteca',    'Biblioteca',     'Biblioteca y centros de informacion',    '#0891b2', 'book',      TRUE),
  (gen_random_uuid(), 'otro',          'Otro',           'Otras categorias sin clasificar',        '#64748b', 'map-pin',   TRUE)
ON CONFLICT (code) DO NOTHING;
