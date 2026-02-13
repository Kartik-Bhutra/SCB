drop DATABASE IF EXISTS striking_app;
CREATE DATABASE IF NOT EXISTS striking_app;
USE striking_app;

CREATE TABLE IF NOT EXISTS admins (
  admin_id CHAR(8) PRIMARY KEY,
  hashed_password CHAR(97) NOT NULL,
  type TINYINT DEFAULT 0,
  revoked_by CHAR(8) DEFAULT NULL,
  FOREIGN KEY(revoked_by)
    REFERENCES admins(admin_id)
    ON DELETE SET NULL
);

INSERT IGNORE INTO admins VALUES
(
  '00bankai',
  '$argon2id$v=19$m=65536,t=3,p=4$gsvk4X+0pHCGpbKdyEEOwQ$Nn4Ou/DFPKbJMZ/ibG6T+PxZ1LDpdZCQ8oeJJrXd4EE',
  TRUE,
  NULL
),
(
  '01bankai',
  '$argon2id$v=19$m=65536,t=3,p=4$7HNqYEOoT6/Rh/C7mFWbqQ$lpq7qPjji91hINkcmYvXT16lcruPrCASJ4fk2houXmo',
  FALSE,
  NULL
);

CREATE TABLE IF NOT EXISTS passkeys (
  id VARBINARY(255) PRIMARY KEY,
  admin_id CHAR(8) NOT NULL,
  public_key VARBINARY(512) NOT NULL,
  counter BIGINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (admin_id)
    REFERENCES admins(admin_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  hashed_number BINARY(32) PRIMARY KEY,
  encrypted_number VARBINARY(50) NOT NULL,
  name VARCHAR(50) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  device_id BINARY(16) UNIQUE NOT NULL,
  hashed_number BINARY(32) NOT NULL,
  reviewed_by CHAR(8) DEFAULT NULL,
  type TINYINT DEFAULT 0,
  FOREIGN KEY (hashed_number)
    REFERENCES users(hashed_number)
    ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by)
    REFERENCES admins(admin_id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS blocks (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  encrypted_number VARBINARY(50) NOT NULL,
  hashed_number BINARY(32) NOT NULL UNIQUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  blocked_by CHAR(8) NULL,
  type TINYINT DEFAULT 0,
  FOREIGN KEY (blocked_by)
    REFERENCES admins(admin_id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS codes (
  code VARCHAR(8) PRIMARY KEY,
  blocked_by CHAR(8) NOT NULL,
  FOREIGN KEY (blocked_by)
    REFERENCES admins(admin_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS apps (
  app VARCHAR(50) PRIMARY KEY,
  blocked_by CHAR(8) NOT NULL,
  FOREIGN KEY (blocked_by)
    REFERENCES admins(admin_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  hashed_number BINARY(32) NOT NULL,
  app VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hashed_number)
    REFERENCES users(hashed_number)
    ON DELETE CASCADE,
  FOREIGN KEY (app)
    REFERENCES apps(app)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reported (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  encrypted_number VARBINARY(50) NOT NULL,
  hashed_number BINARY(32) UNIQUE NOT NULL,
  type SMALLINT DEFAULT 0,
  reviewed_by CHAR(8) DEFAULT NULL,
  FOREIGN KEY (reviewed_by)
    REFERENCES admins(admin_id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reporters (
  hashed_number BINARY(32) NOT NULL,
  hashed_reported BINARY(32) NOT NULL,
  type TINYINT DEFAULT 0,
  PRIMARY KEY (hashed_number, hashed_reported),
  FOREIGN KEY (hashed_number)
    REFERENCES users(hashed_number)
    ON DELETE CASCADE,
  FOREIGN KEY (hashed_reported)
    REFERENCES reported(hashed_number)
    ON DELETE CASCADE
);
