CREATE DATABASE IF NOT EXISTS SCB;

USE SCB;

CREATE TABLE IF NOT EXISTS users (
  mobileNoHashed VARCHAR(50) PRIMARY KEY,
  -- for searching mobileNoHashed
  deviceIdHashed VARCHAR(50),
  -- for checking that request was made or not
  mobileNoEncrypted VARCHAR(75) NOT NULL,
  username VARCHAR(30) NOT NULL,
  -- for clients, and reference for admins
  authenticated BOOLEAN DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  userId VARCHAR(30) PRIMARY KEY,
  passwordHashed VARCHAR(100) NOT NULL,
  mobileNoHashed VARCHAR(50),
  role BOOLEAN DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_mobileNo FOREIGN KEY (mobileNoHashed) REFERENCES users (mobileNoHashed) ON DELETE CASCADE ON UPDATE CASCADE -- admin is also a client
);