-- BB FlexLearn MySQL schema (MySQL 8+ / MariaDB 10.5+), utf8mb4
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar MEDIUMTEXT,
  role ENUM('admin','teacher','student') NOT NULL DEFAULT 'student',
  department VARCHAR(255),
  phone VARCHAR(64),
  enrolled_course_ids JSON NOT NULL,
  created_at VARCHAR(64) NOT NULL,
  token_version INT NOT NULL DEFAULT 0
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  category VARCHAR(64),
  published TINYINT(1) NOT NULL DEFAULT 0,
  created_by_id VARCHAR(64),
  classroom_code VARCHAR(64),
  data LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_courses_creator (created_by_id),
  INDEX idx_courses_code (classroom_code)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS progress (
  user_id VARCHAR(64) NOT NULL,
  course_id VARCHAR(64) NOT NULL,
  data LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id),
  INDEX idx_progress_course (course_id)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS watch_progress (
  user_id VARCHAR(64) NOT NULL,
  course_id VARCHAR(64) NOT NULL,
  lesson_key VARCHAR(64) NOT NULL,
  data LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id, lesson_key),
  INDEX idx_watch_course (course_id)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS certificates (
  id VARCHAR(64) PRIMARY KEY,
  credential_id VARCHAR(128),
  user_id VARCHAR(64) NOT NULL,
  course_id VARCHAR(64) NOT NULL,
  data LONGTEXT NOT NULL,
  INDEX idx_cert_user (user_id),
  INDEX idx_cert_course (course_id),
  INDEX idx_cert_cred (credential_id)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  to_email VARCHAR(255) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  data LONGTEXT NOT NULL,
  INDEX idx_notif_email (to_email)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS notes (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  course_id VARCHAR(64),
  data LONGTEXT NOT NULL,
  INDEX idx_notes_user (user_id)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS analytics (
  course_id VARCHAR(64) PRIMARY KEY,
  data LONGTEXT NOT NULL
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS app_settings (
  k VARCHAR(64) PRIMARY KEY,
  v LONGTEXT NOT NULL
) CHARACTER SET utf8mb4;

-- ใบประกาศฯ ที่ admin ลบ (tombstone กัน client เครื่องอื่น sync ใบเดิมกลับมา)
CREATE TABLE IF NOT EXISTS deleted_certificates (
  id VARCHAR(64) PRIMARY KEY,
  deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4;
