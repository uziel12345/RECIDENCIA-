-- Adds RFC support for imported professors and academic metadata for schedules.
-- Apply with: mysql -u <usuario> -p mapa_ito < docs/migration-professor-schedule-import-20260615.sql

ALTER TABLE professors
  ADD COLUMN rfc VARCHAR(13) NULL AFTER employee_number,
  ADD KEY idx_professors_rfc (rfc);

ALTER TABLE schedules
  ADD COLUMN subject_code VARCHAR(50) NULL AFTER subject,
  ADD COLUMN subject_name VARCHAR(255) NULL AFTER subject_code,
  ADD COLUMN group_code VARCHAR(50) NULL AFTER period,
  ADD COLUMN career_code VARCHAR(50) NULL AFTER group_code,
  ADD COLUMN career_name VARCHAR(255) NULL AFTER career_code;
